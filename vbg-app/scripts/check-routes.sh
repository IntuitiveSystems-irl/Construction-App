#!/bin/bash

# VBG Route Checker
# Simple bash script to find all routes and generate a report

echo "🧪 VBG Route Testing"
echo "===================="
echo ""

APP_DIR="/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/app"
REPORT_FILE="/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/route-report.txt"

# Clear previous report
> "$REPORT_FILE"

echo "VBG Route Testing Report" >> "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "===========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Find all page.tsx files
echo "📍 Scanning for routes..."
echo "" >> "$REPORT_FILE"
echo "ROUTES FOUND:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

route_count=0

# Find all page files and convert to routes
find "$APP_DIR" -name "page.tsx" -o -name "page.ts" | while read file; do
    # Get relative path from app directory
    rel_path="${file#$APP_DIR}"
    
    # Remove /page.tsx
    route="${rel_path%/page.tsx}"
    route="${route%/page.ts}"
    
    # Convert [id] to :id
    route=$(echo "$route" | sed 's/\[/:/g' | sed 's/\]//g')
    
    # Handle root
    if [ -z "$route" ]; then
        route="/"
    fi
    
    # Categorize
    category="Public"
    auth="[PUBLIC]"
    
    if [[ "$route" == /admin* ]]; then
        category="Admin"
        auth="[AUTH]"
    elif [[ "$route" == /dashboard* ]]; then
        category="Dashboard"
        auth="[AUTH]"
    elif [[ "$route" == *":id"* ]] || [[ "$route" == *":slug"* ]]; then
        category="Dynamic"
        auth="[AUTH]"
    elif [[ "$route" != "/" ]] && [[ "$route" != "/login" ]] && [[ "$route" != "/register" ]] && [[ "$route" != "/services" ]]; then
        auth="[AUTH]"
    fi
    
    echo "$auth [$category] $route" >> "$REPORT_FILE"
    echo "  ✓ $route"
    ((route_count++))
done

echo ""
echo "Total routes found: $route_count"
echo "" >> "$REPORT_FILE"
echo "Total routes: $route_count" >> "$REPORT_FILE"

# Find unused components
echo ""
echo "🔍 Checking for potentially unused components..."
echo "" >> "$REPORT_FILE"
echo "POTENTIALLY UNUSED COMPONENTS:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

unused_count=0

if [ -d "$APP_DIR/components" ]; then
    for component in "$APP_DIR/components"/*.tsx "$APP_DIR/components"/*.jsx; do
        if [ -f "$component" ]; then
            comp_name=$(basename "$component" .tsx)
            comp_name=$(basename "$comp_name" .jsx)
            
            # Search for usage
            usage_count=$(grep -r "$comp_name" "$APP_DIR" --include="*.tsx" --include="*.jsx" | grep -v "$(basename "$component")" | wc -l)
            
            if [ "$usage_count" -eq 0 ]; then
                echo "• $comp_name" >> "$REPORT_FILE"
                echo "  ⚠ $comp_name (possibly unused)"
                ((unused_count++))
            fi
        fi
    done
fi

echo ""
echo "Potentially unused components: $unused_count"
echo "" >> "$REPORT_FILE"
echo "Total unused: $unused_count" >> "$REPORT_FILE"

# Summary
echo ""
echo "===================="
echo "📊 Summary:"
echo "  ✓ $route_count routes found"
echo "  ⚠ $unused_count potentially unused components"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""

# Also create a simple route list
ROUTE_LIST="/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/ROUTES.md"
echo "# VBG Application Routes" > "$ROUTE_LIST"
echo "" >> "$ROUTE_LIST"
echo "Generated: $(date)" >> "$ROUTE_LIST"
echo "" >> "$ROUTE_LIST"
echo "## All Routes" >> "$ROUTE_LIST"
echo "" >> "$ROUTE_LIST"

find "$APP_DIR" -name "page.tsx" -o -name "page.ts" | while read file; do
    rel_path="${file#$APP_DIR}"
    route="${rel_path%/page.tsx}"
    route="${route%/page.ts}"
    route=$(echo "$route" | sed 's/\[/:/g' | sed 's/\]//g')
    
    if [ -z "$route" ]; then
        route="/"
    fi
    
    echo "- \`$route\`" >> "$ROUTE_LIST"
done

echo "📝 Route list saved to: $ROUTE_LIST"
