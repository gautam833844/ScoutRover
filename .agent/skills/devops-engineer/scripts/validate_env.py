#!/usr/bin/env python3
import os
import sys
import argparse

def check_env_file(filepath, required_keys):
    if not os.path.exists(filepath):
        return [f"File does not exist: {filepath}"]

    findings = []
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    lines = content.splitlines()
    keys_in_file = set()
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key = line.split("=", 1)[0].strip()
            keys_in_file.add(key)

    for req_key in required_keys:
        if req_key not in keys_in_file:
            findings.append(f"Missing required key: {req_key}")

    return findings

def main():
    parser = argparse.ArgumentParser(description="Validate environment variable files in the workspace.")
    args = parser.parse_args()

    workspace_root = os.getcwd()
    
    backend_env = os.path.join(workspace_root, "backend", ".env")
    frontend_env = os.path.join(workspace_root, "frontend", ".env")

    required_backend = ["MONGODB_URI", "JWT_SECRET", "REFRESH_TOKEN_SECRET", "PORT"]
    required_frontend = ["NEXT_PUBLIC_API_URL"]

    print("### Environment Verification Report\n")
    
    backend_issues = check_env_file(backend_env, required_backend)
    frontend_issues = check_env_file(frontend_env, required_frontend)

    total_issues = len(backend_issues) + len(frontend_issues)

    print("#### Backend Environment Configuration")
    if not backend_issues:
        print("✅ Backend environment is valid.")
    else:
        for issue in backend_issues:
            print(f"- [Warning]: {issue}")
    print()

    print("#### Frontend Environment Configuration")
    if not frontend_issues:
        print("✅ Frontend environment is valid.")
    else:
        for issue in frontend_issues:
            print(f"- [Warning]: {issue}")
    print()

    if total_issues > 0:
        print(f"Validation complete. Found {total_issues} issues that might block system startup.")
    else:
        print("All environment configurations verified successfully.")

if __name__ == "__main__":
    main()
