#!/bin/bash

# VBG Admin Color Lightening Script
# Makes admin pages match the lighter, cleaner look of user-facing pages

echo "🎨 Lightening admin page colors to match user pages..."

# Find all .tsx files in the admin directory
find "/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/app/admin" -name "*.tsx" -type f | while read file; do
  # Replace dark gray backgrounds with lighter ones
  sed -i '' 's/bg-gray-900/bg-white/g' "$file"
  sed -i '' 's/bg-gray-800/bg-gray-50/g' "$file"
  sed -i '' 's/bg-slate-900/bg-white/g' "$file"
  sed -i '' 's/bg-slate-800/bg-gray-50/g' "$file"
  
  # Replace dark text with medium gray
  sed -i '' 's/text-gray-900/text-gray-700/g' "$file"
  sed -i '' 's/text-slate-900/text-gray-700/g' "$file"
  
  # Replace dark borders with lighter ones
  sed -i '' 's/border-gray-800/border-gray-200/g' "$file"
  sed -i '' 's/border-gray-900/border-gray-300/g' "$file"
  
  # Replace dark hover states
  sed -i '' 's/hover:bg-gray-800/hover:bg-gray-100/g' "$file"
  sed -i '' 's/hover:bg-gray-900/hover:bg-gray-50/g' "$file"
  
  # Replace dark ring colors
  sed -i '' 's/ring-gray-800/ring-gray-300/g' "$file"
  sed -i '' 's/ring-gray-900/ring-gray-400/g' "$file"
done

echo "✅ Admin color lightening complete!"
echo "📊 Admin files updated: $(find '/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/app/admin' -name '*.tsx' -type f | wc -l | tr -d ' ')"
