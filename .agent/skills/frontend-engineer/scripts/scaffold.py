#!/usr/bin/env python3
import os
import sys
import argparse

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new React component for the Next.js app.")
    parser.add_argument("name", help="Name of the component (e.g. TelemetryCard)")
    parser.add_argument("--type", choices=["client", "server"], default="client", help="Client or Server component")
    parser.add_argument("--css", action="store_true", help="Generate CSS Module file")
    parser.add_argument("--outdir", default="frontend/src/components", help="Target output directory relative to workspace root")

    args = parser.parse_args()

    # Ensure output directory exists
    workspace_root = os.getcwd()
    target_dir = os.path.join(workspace_root, args.outdir, args.name)

    try:
        os.makedirs(target_dir, exist_ok=True)
    except Exception as e:
        print(f"Error creating directory: {e}", file=sys.stderr)
        sys.exit(1)

    component_file = os.path.join(target_dir, "index.tsx")
    css_file = os.path.join(target_dir, f"{args.name}.module.css")

    # Generate Component Content
    directive = '"use client";\n\n' if args.type == "client" else ""
    css_import = f"import styles from './{args.name}.module.css';\n" if args.css else ""

    component_content = f"""{directive}import React from 'react';
{css_import}
interface {args.name}Props {{
  className?: string;
  children?: React.ReactNode;
}}

export const {args.name}: React.FC<{args.name}Props> = ({{ className, children }}) => {{
  return (
    <div className={'{'}{f"styles.container" if args.css else "''"}{'}'}>
      <h2>{args.name} Component ({args.type})</h2>
      {'{children}'}
    </div>
  );
}};

export default {args.name};
"""

    try:
        with open(component_file, "w", encoding="utf-8") as f:
            f.write(component_content)
        print(f"Created component: {os.path.relpath(component_file, workspace_root)}")

        if args.css:
            css_content = """.container {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border, #eaeaea);
  background-color: var(--surface, #ffffff);
}
"""
            with open(css_file, "w", encoding="utf-8") as f:
                f.write(css_content)
            print(f"Created CSS Module: {os.path.relpath(css_file, workspace_root)}")
            
    except Exception as e:
        print(f"Error writing files: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
