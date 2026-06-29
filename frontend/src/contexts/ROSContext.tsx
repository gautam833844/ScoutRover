'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { ROS_CONFIG } from '@/constants';
import { useToast } from './ToastContext';

interface LiveGridData {
  gridData: Int8Array;
  width: number;
  height: number;
  resolution: number;
  originX: number;
  originY: number;
}

interface ROSContextType {
  rosStatus: 'disconnected' | 'connecting' | 'connected';
  connectToROS: () => Promise<void>;
  disconnectFromROS: () => void;
  liveGrid: LiveGridData | null;
  lastMapUpdate: string | null;
  cmdVelTopic: any | null;
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;
  odomSpeed: number;
  odomHeading: number;
  odomPosition: { x: number; y: number };
}

const ROSContext = createContext<ROSContextType | null>(null);

export function ROSProvider({ children }: { children: ReactNode }) {
  const { info, error, success } = useToast();
  const [rosStatus, setRosStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [liveGrid, setLiveGrid] = useState<LiveGridData | null>(null);
  const [lastMapUpdate, setLastMapUpdate] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  // Live real-time telemetry states
  const [odomSpeed, setOdomSpeed] = useState<number>(0);
  const [odomHeading, setOdomHeading] = useState<number>(0);
  const [odomPosition, setOdomPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const rosRef = useRef<any>(null);
  const cmdVelRef = useRef<any>(null);
  const mapListenerRef = useRef<any>(null);
  const odomListenerRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const isLiveModeRef = useRef<boolean>(false);

  // Sync ref with state
  useEffect(() => {
    isLiveModeRef.current = isLiveMode;
  }, [isLiveMode]);

  const disconnectFromROS = useCallback(() => {
    // Clear timeouts and intervals
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (mapListenerRef.current) {
      mapListenerRef.current.unsubscribe();
      mapListenerRef.current = null;
    }
    if (odomListenerRef.current) {
      odomListenerRef.current.unsubscribe();
      odomListenerRef.current = null;
    }
    if (rosRef.current) {
      try {
        rosRef.current.close();
      } catch (err) {
        // ignore close errors
      }
      rosRef.current = null;
    }
    cmdVelRef.current = null;
    setRosStatus('disconnected');
    setLiveGrid(null);
    setOdomSpeed(0);
    setOdomHeading(0);
    setOdomPosition({ x: 0, y: 0 });
  }, []);

  const connectToROS = useCallback(async () => {
    // If already connected or connecting, return
    if (rosRef.current && (rosRef.current.isConnected || rosStatus === 'connecting')) {
      return;
    }

    setRosStatus('connecting');

    try {
      const { Ros, Topic } = await import('roslib');
      const ros = new Ros({ url: ROS_CONFIG.url });
      rosRef.current = ros;

      const handleReconnect = () => {
        if (!isLiveModeRef.current) return;
        if (reconnectTimeoutRef.current) return;

        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        retryCountRef.current += 1;

        info('Reconnecting', `Attempting to reconnect to ROS in ${(delay / 1000).toFixed(0)}s (Attempt ${retryCountRef.current})`);

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectToROS();
        }, delay);
      };

      ros.on('connection', () => {
        setRosStatus('connected');
        retryCountRef.current = 0;
        success('ROS Connected', 'Successfully connected to ROS bridge');

        // Heartbeat verification loop
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (rosRef.current && !rosRef.current.isConnected) {
            console.warn('[ROS] Heartbeat check failed, triggering socket recycle.');
            if (heartbeatIntervalRef.current) {
              clearInterval(heartbeatIntervalRef.current);
              heartbeatIntervalRef.current = null;
            }
            try {
              rosRef.current.close();
            } catch { }
          }
        }, 10000);

        // Velocity publisher
        cmdVelRef.current = new Topic({
          ros,
          name: ROS_CONFIG.cmdVelTopic,
          messageType: 'geometry_msgs/Twist',
        });

        // Odom telemetry subscriber
        odomListenerRef.current = new Topic({
          ros,
          name: '/odom',
          messageType: 'nav_msgs/Odometry',
          throttle_rate: 100,
        });

        odomListenerRef.current.subscribe((message: any) => {
          if (message && message.pose && message.pose.pose) {
            const pos = message.pose.pose.position;
            const ori = message.pose.pose.orientation;
            const twist = message.twist?.twist;
            
            // Convert orientation quaternion to yaw angle (in degrees)
            const qx = ori.x || 0;
            const qy = ori.y || 0;
            const qz = ori.z || 0;
            const qw = ori.w || 1;
            
            // yaw (heading) from quaternion
            const siny_cosp = 2 * (qw * qz + qx * qy);
            const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
            const yaw = Math.atan2(siny_cosp, cosy_cosp);
            let headingDegrees = Math.round((yaw * 180) / Math.PI);
            if (headingDegrees < 0) headingDegrees += 360; // Map to 0-360 degrees
            
            setOdomSpeed(twist?.linear?.x || 0);
            setOdomHeading(headingDegrees);
            setOdomPosition({ x: pos.x || 0, y: pos.y || 0 });
          }
        });

        // Load current mapping config
        let mapTopic = ROS_CONFIG.mapTopic;
        try {
          const cfg = JSON.parse(localStorage.getItem('scoutrover_mapping_config') || '{}');
          if (cfg.mapTopic) mapTopic = cfg.mapTopic;
        } catch { }

        // Live grid subscriber
        mapListenerRef.current = new Topic({
          ros,
          name: mapTopic,
          messageType: 'nav_msgs/OccupancyGrid',
          throttle_rate: ROS_CONFIG.mapThrottleRate,
          queue_length: 1,
        });

        mapListenerRef.current.subscribe((message: any) => {
          if (message && message.info && message.data) {
            // Zero-copy typed array wrap (Task 13/M8)
            const gridData = new Int8Array(message.data);
            setLiveGrid({
              gridData,
              width: message.info.width,
              height: message.info.height,
              resolution: message.info.resolution,
              originX: message.info.origin?.position?.x || 0,
              originY: message.info.origin?.position?.y || 0,
            });
            setLastMapUpdate(new Date().toISOString());
          }
        });
      });

      ros.on('error', (err: any) => {
        setRosStatus('disconnected');
        console.warn('[ROS] error:', err);
        handleReconnect();
      });

      ros.on('close', () => {
        setRosStatus('disconnected');
        handleReconnect();
      });
    } catch (err) {
      setRosStatus('disconnected');
      console.warn('[ROS] connection error:', err);
      error('Connection failed', `Could not reach rosbridge at ${ROS_CONFIG.url}`);
    }
  }, [info, error, success]);

  // Handle live mode auto-connection shifts
  useEffect(() => {
    if (isLiveMode) {
      connectToROS();
    } else {
      disconnectFromROS();
    }
  }, [isLiveMode, connectToROS, disconnectFromROS]);

  // Global socket cleanup on context shutdown
  useEffect(() => {
    return () => {
      disconnectFromROS();
    };
  }, [disconnectFromROS]);

  return (
    <ROSContext.Provider
      value={{
        rosStatus,
        connectToROS,
        disconnectFromROS,
        liveGrid,
        lastMapUpdate,
        cmdVelTopic: cmdVelRef.current,
        isLiveMode,
        setIsLiveMode,
        odomSpeed,
        odomHeading,
        odomPosition,
      }}
    >
      {children}
    </ROSContext.Provider>
  );
}

export function useROS() {
  const context = useContext(ROSContext);
  if (!context) throw new Error('useROS must be used within a ROSProvider');
  return context;
}
