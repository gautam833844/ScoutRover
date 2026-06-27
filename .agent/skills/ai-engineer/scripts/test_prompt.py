#!/usr/bin/env python3
import sys
import argparse

def estimate_tokens(text):
    # Standard approximation: 1 token ~= 4 characters or 0.75 words
    char_count = len(text)
    word_count = len(text.split())
    approx_tokens = int(max(char_count / 4.0, word_count / 0.75))
    return approx_tokens

def main():
    parser = argparse.ArgumentParser(description="Estimate token counts and review prompt payloads.")
    parser.add_argument("--system", required=True, help="System prompt / instruction text")
    parser.add_argument("--user", required=True, help="User query / prompt text")
    parser.add_argument("--json", action="store_true", help="Print payload as JSON format")

    args = parser.parse_args()

    system_tokens = estimate_tokens(args.system)
    user_tokens = estimate_tokens(args.user)
    total_tokens = system_tokens + user_tokens

    if args.json:
        import json
        payload = {
            "messages": [
                {"role": "system", "content": args.system},
                {"role": "user", "content": args.user}
            ],
            "metadata": {
                "estimated_tokens": {
                    "system": system_tokens,
                    "user": user_tokens,
                    "total": total_tokens
                }
            }
        }
        print(json.dumps(payload, indent=2))
        return

    print("### Prompt Evaluation & Payload Report\n")
    print("#### Payload Structure:")
    print(f"- **System (Instructions)**: \"{args.system[:100]}...\"")
    print(f"- **User (Input)**: \"{args.user[:100]}...\"")
    print()
    print("#### Token Cost Approximation:")
    print(f"- System Prompt: ~{system_tokens} tokens")
    print(f"- User Prompt: ~{user_tokens} tokens")
    print(f"- **Total Input Size**: ~{total_tokens} tokens")
    print("\n*Note: Tokens are estimated using character and word frequency approximations (1 token ≈ 4 chars).*")

if __name__ == "__main__":
    main()
