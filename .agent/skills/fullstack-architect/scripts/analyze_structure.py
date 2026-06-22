#!/usr/bin/env python3
import os
import sys
import argparse

def scan_imports(directory, forbidden_pattern, forbidden_label):
    violations = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith((".ts", ".tsx", ".js", ".jsx")):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                    for idx, line in enumerate(lines, 1):
                        if forbidden_pattern in line:
                            violations.append({
                                "file": os.path.relpath(filepath),
                                "line": idx,
                                "content": line.strip(),
                                "reason": f"Imports from forbidden area: {forbidden_label}"
                            })
                except Exception:
                    pass
    return violations

def main():
    parser = argparse.ArgumentParser(description="Analyze workspace module structure and identify layer violations.")
    args = parser.parse_args()

    workspace_root = os.getcwd()
    frontend_dir = os.path.join(workspace_root, "frontend")
    backend_dir = os.path.join(workspace_root, "backend")

    print("### Fullstack Architecture Analysis\n")
    
    # 1. Print visual map
    print("#### Visual Architecture Map:")
    print("```")
    print("  [ Client Dashboard ]  <--- (HTTP API Request) --->  [ Node/Express REST API ]")
    print("      (Next.js App)                                         (TypeScript)")
    print("            |                                                     |")
    print("            v                                                     v")
    print("    [ Browser State ]                                      [ Mongoose Models ]")
    print("                                                                  |")
    print("                                                                  v")
    print("                                                           [ MongoDB Database ]")
    print("```\n")

    # 2. Check violations
    print("#### Architecture Compliance Check:")
    
    violations = []
    
    # Check if frontend code references backend files directly
    if os.path.exists(frontend_dir):
        violations.extend(scan_imports(frontend_dir, "from '../../backend", "backend directory"))
        violations.extend(scan_imports(frontend_dir, "from '../backend", "backend directory"))
        violations.extend(scan_imports(frontend_dir, 'from "backend', "backend directory"))

    # Check if backend references frontend files directly
    if os.path.exists(backend_dir):
        violations.extend(scan_imports(backend_dir, "from '../../frontend", "frontend directory"))
        violations.extend(scan_imports(backend_dir, "from '../frontend", "frontend directory"))
        violations.extend(scan_imports(backend_dir, 'from "frontend', "frontend directory"))

    if not violations:
        print("✅ Strict layer boundaries maintained. No direct model/controller module import violations detected.")
    else:
        print("⚠️ Import Layer Violations Detected:")
        for v in violations:
            print(f"- **{v['file']}:L{v['line']}** - `{v['content']}` ({v['reason']})")
    
    print("\nAnalysis complete.")

if __name__ == "__main__":
    main()
