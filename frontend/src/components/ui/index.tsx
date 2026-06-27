'use client';

import React, { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, useState, useEffect, useRef, ReactNode } from 'react';
import { clsx } from 'clsx';
import { X, Check, AlertCircle, Info, AlertTriangle, ChevronDown, Search, Loader2, Eye, EyeOff } from 'lucide-react';
import { ToastType } from '@/types';
import { getPasswordStrength } from '@/utils/validators';

// ========== BUTTON ==========
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'inverted' | 'on-dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary', size = 'md', loading, icon, iconRight, children, className, disabled, ...props
}, ref) => {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    outline: 'btn-outline',
    inverted: 'bg-white text-brand-600 hover:bg-white/90 border border-white',
    'on-dark': 'bg-transparent text-white border border-white/20 hover:bg-white/10',
  };
  const sizes = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  return (
    <button
      ref={ref}
      className={clsx(variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
      {iconRight}
    </button>
  );
});
Button.displayName = 'Button';

// ========== INPUT ==========
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, hint, leftIcon, rightIcon, className, type, ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          type={isPassword && showPassword ? 'text' : type}
          className={clsx(
            'input',
            leftIcon && 'pl-10',
            (rightIcon || isPassword) && 'pr-10',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
            {rightIcon}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-surface-400">{hint}</p>}
    </div>
  );
});
Input.displayName = 'Input';

// ========== TEXTAREA ==========
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className, ...props
}, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      className={clsx('input min-h-[100px] resize-y', error && 'input-error', className)}
      {...props}
    />
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ========== SELECT ==========
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, placeholder, className, ...props
}, ref) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        className={clsx('input appearance-none pr-10', error && 'input-error', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ========== TOGGLE SWITCH ==========
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        {label && <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{label}</span>}
        {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx('toggle-track', checked && 'active', disabled && 'opacity-50 cursor-not-allowed')}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

// ========== MODAL ==========
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
      <div className={clsx('modal-content', sizes[size])} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-white/[0.08]">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close dialog">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-surface-200 dark:border-white/[0.08] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== SEARCH BAR ==========
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className }: SearchBarProps) {
  return (
    <div className={clsx('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
    </div>
  );
}

// ========== SPINNER ==========
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return <Loader2 className={clsx(sizes[size], 'animate-spin text-brand-500', className)} />;
}

// ========== SKELETON ==========
export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} />;
}

// ========== BADGE ==========
interface BadgeProps {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
  dot?: boolean;
}

export function Badge({ variant = 'brand', children, dot }: BadgeProps) {
  const variants = {
    brand: 'badge-brand',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  };
  return (
    <span className={variants[variant]}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', {
        'bg-brand-500': variant === 'brand',
        'bg-emerald-500': variant === 'success',
        'bg-amber-500': variant === 'warning',
        'bg-red-500': variant === 'danger',
        'bg-blue-500': variant === 'info',
      })} />}
      {children}
    </span>
  );
}

// ========== AVATAR ==========
interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  };
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={clsx('avatar', sizes[size], className)} />;
  }
  return (
    <div className={clsx('avatar', sizes[size], className)}>
      {initials}
    </div>
  );
}

// ========== TABS ==========
interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

export function Tabs({ items, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={clsx('flex gap-1 border-b border-surface-200 dark:border-white/[0.08]', className)} role="tablist">
      {items.map(item => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={clsx('tab flex items-center gap-2', activeKey === item.key && 'active')}
          role="tab"
          aria-selected={activeKey === item.key}
          tabIndex={activeKey === item.key ? 0 : -1}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ========== EMPTY STATE ==========
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4 text-surface-300 dark:text-surface-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-300">{title}</h3>
      {description && <p className="text-sm text-surface-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ========== TOAST CONTAINER ==========
const toastStyles: Record<ToastType, { bg: string; icon: ReactNode }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300',
    icon: <Check className="w-5 h-5 text-emerald-500" />,
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300',
    icon: <AlertCircle className="w-5 h-5 text-red-500" />,
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-800 dark:text-blue-300',
    icon: <Info className="w-5 h-5 text-blue-500" />,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300',
    icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  },
};

function ToastItem({ toast, onRemove }: { toast: import('@/types').Toast; onRemove: (id: string) => void }) {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => onRemove(toast.id), 250); // Wait for slide-out animation (250ms)
      }, toast.duration - 250);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const handleManualRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 250);
  };

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto transition-all',
        isLeaving ? 'animate-slide-out-right' : 'animate-slide-in-right',
        toastStyles[toast.type].bg
      )}
    >
      <span className="flex-shrink-0 mt-0.5">{toastStyles[toast.type].icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.message && <p className="text-xs mt-0.5 opacity-80">{toast.message}</p>}
      </div>
      <button onClick={handleManualRemove} className="flex-shrink-0 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: import('@/types').Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

// ========== PASSWORD STRENGTH BAR ==========
export function PasswordStrength({ password }: { password: string }) {
  const { score, label, color } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className={clsx('h-1 flex-1 rounded-full transition-colors', i <= score ? color : 'bg-surface-200 dark:bg-surface-700')}
          />
        ))}
      </div>
      <p className={clsx('text-xs mt-1', {
        'text-red-500': score <= 2,
        'text-amber-500': score <= 4 && score > 2,
        'text-emerald-500': score > 4,
      })}>{label}</p>
    </div>
  );
}

// ========== TOOLTIP ==========
interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={clsx(
          'absolute z-50 px-2.5 py-1.5 text-xs font-medium text-white bg-surface-900 dark:bg-surface-100 dark:text-surface-900 rounded-lg whitespace-nowrap animate-fade-in',
          positions[position]
        )}>
          {content}
        </div>
      )}
    </div>
  );
}

// ========== SECTION WRAPPER ==========
export function Section({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={clsx('section', className)}>
      <div className="section-container">{children}</div>
    </section>
  );
}

// ========== BREADCRUMB ==========
interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-surface-500 dark:text-surface-400 mb-6">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span>/</span>}
          {item.href ? (
            <a href={item.href} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{item.label}</a>
          ) : (
            <span className="text-surface-900 dark:text-white font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
