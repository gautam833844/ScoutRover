#!/usr/bin/env python3
import os
import sys
import json
import argparse

def get_data_path(filename):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_dir, "data", filename)

def load_json(filename):
    filepath = get_data_path(filename)
    if not os.path.exists(filepath):
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return []

def main():
    parser = argparse.ArgumentParser(description="Query local design data to compile custom theme sheets.")
    parser.add_argument("query", nargs="?", default="", help="Query keywords (e.g. 'dark', 'contrast', 'dashboard')")
    parser.add_argument("--design-system", action="store_true", help="Generate complete design system guidelines")
    parser.add_argument("-p", "--project", default="ScoutRover App", help="Project name")
    parser.add_argument("--domain", help="Target domain category (e.g. 'fintech', 'robotics')")
    parser.add_argument("--stack", help="Framework stack (e.g. 'html-tailwind', 'nextjs')")

    args = parser.parse_args()

    # Load resources
    palettes = load_json("color_palettes.json")
    styles = load_json("design_styles.json")
    fonts = load_json("font_pairings.json")
    ux_rules = load_json("ux_guidelines.json")
    accessibility = load_json("accessibility_rules.json")
    patterns = load_json("component_patterns.json")

    print(f"# Design Intelligence: {args.project}\n")

    # Match based on queries
    q = args.query.lower()

    if args.design_system:
        # Standard design system output
        print("## Curated Color System")
        for palette in palettes:
            print(f"### {palette.get('name')}")
            print(f"*{palette.get('description')}*")
            print(f"- **Primary**: `{palette.get('primary')}`")
            print(f"- **Background**: `{palette.get('background')}`")
            print(f"- **Surface**: `{palette.get('surface')}`")
            print(f"- **Text**: `{palette.get('text')}`")
            print(f"- **Accent**: `{palette.get('accent')}`")
            print(f"- **Border**: `{palette.get('border')}`")
            print()
        
        print("## Active Design Style Guides")
        for style in styles:
            print(f"### Style: {style.get('name')}")
            print(f"*{style.get('description')}*")
            print("```css")
            for k, v in style.get("cssRules", {}).items():
                print(f"  {k}: {v};")
            print("```\n")

        print("## Recommended Typography Pairings")
        for font in fonts:
            print(f"### {font.get('name')}")
            print(f"*{font.get('description')}*")
            print(f"- **Headings**: `{font.get('headings')}`")
            print(f"- **Body**: `{font.get('body')}`")
            print()
        return

    # Regular keyword-based search
    matches_found = False

    if q or args.domain or args.stack:
        print(f"### Matching records for search: '{args.query}'")
        if args.domain:
            print(f"- Domain target: `{args.domain}`")
        if args.stack:
            print(f"- Stack: `{args.stack}`")
        print()

        # Check UX rules
        matching_rules = [r for r in ux_rules if q in r.get("rule", "").lower() or q in r.get("category", "").lower()]
        if matching_rules:
            matches_found = True
            print("#### UX Guidelines")
            for r in matching_rules:
                print(f"- **[{r.get('priority')}] {r.get('category')}**: {r.get('rule')}")
                print(f"  *Details*: {r.get('details')}")
            print()

        # Check colors/palettes
        matching_palettes = [p for p in palettes if q in p.get("name", "").lower() or q in p.get("description", "").lower()]
        if matching_palettes:
            matches_found = True
            print("#### Color Palettes")
            for p in matching_palettes:
                print(f"- **{p.get('name')}**: {p.get('description')}")
                print(f"  *Primary*: {p.get('primary')} | *Background*: {p.get('background')} | *Surface*: {p.get('surface')}")
            print()

        # Check accessibility
        matching_acc = [a for a in accessibility if q in a.get("name", "").lower() or q in a.get("description", "").lower()]
        if matching_acc:
            matches_found = True
            print("#### Accessibility Regulations")
            for a in matching_acc:
                print(f"- **{a.get('ruleId')} ({a.get('level')})**: {a.get('name')} - {a.get('description')}")
            print()

    if not matches_found:
        print("No specific keyword matches found. Use `--design-system` to list all available presets and configurations.")

if __name__ == "__main__":
    main()
