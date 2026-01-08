#!/bin/bash

# VBG Color Update Script
# Updates all old blue colors to cyan/teal brand colors across the app

echo "🎨 Updating VBG brand colors..."

# Find all .tsx files in the app directory
find "/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/app" -name "*.tsx" -type f | while read file; do
  # Replace blue with cyan for backgrounds
  sed -i '' 's/bg-blue-50/bg-cyan-50/g' "$file"
  sed -i '' 's/bg-blue-100/bg-cyan-100/g' "$file"
  sed -i '' 's/bg-blue-200/bg-cyan-200/g' "$file"
  sed -i '' 's/bg-blue-500/bg-cyan-500/g' "$file"
  sed -i '' 's/bg-blue-600/bg-cyan-600/g' "$file"
  sed -i '' 's/bg-blue-700/bg-cyan-700/g' "$file"
  sed -i '' 's/bg-blue-800/bg-cyan-800/g' "$file"
  
  # Replace blue with cyan for text
  sed -i '' 's/text-blue-50/text-cyan-50/g' "$file"
  sed -i '' 's/text-blue-100/text-cyan-100/g' "$file"
  sed -i '' 's/text-blue-500/text-cyan-500/g' "$file"
  sed -i '' 's/text-blue-600/text-cyan-600/g' "$file"
  sed -i '' 's/text-blue-700/text-cyan-700/g' "$file"
  sed -i '' 's/text-blue-800/text-cyan-800/g' "$file"
  sed -i '' 's/text-blue-900/text-cyan-900/g' "$file"
  
  # Replace blue with cyan for borders
  sed -i '' 's/border-blue-50/border-cyan-50/g' "$file"
  sed -i '' 's/border-blue-100/border-cyan-100/g' "$file"
  sed -i '' 's/border-blue-200/border-cyan-200/g' "$file"
  sed -i '' 's/border-blue-500/border-cyan-500/g' "$file"
  sed -i '' 's/border-blue-600/border-cyan-600/g' "$file"
  
  # Replace blue with cyan for gradients
  sed -i '' 's/from-blue-500/from-cyan-500/g' "$file"
  sed -i '' 's/from-blue-600/from-cyan-600/g' "$file"
  sed -i '' 's/to-blue-600/to-teal-600/g' "$file"
  sed -i '' 's/to-blue-700/to-teal-700/g' "$file"
  
  # Replace blue with cyan for focus rings
  sed -i '' 's/ring-blue-500/ring-cyan-500/g' "$file"
  sed -i '' 's/focus:ring-blue-500/focus:ring-cyan-500/g' "$file"
  
  # Replace blue with cyan for hover states
  sed -i '' 's/hover:bg-blue-600/hover:bg-cyan-600/g' "$file"
  sed -i '' 's/hover:bg-blue-700/hover:bg-cyan-700/g' "$file"
  sed -i '' 's/hover:text-blue-600/hover:text-cyan-600/g' "$file"
  sed -i '' 's/hover:text-blue-700/hover:text-cyan-700/g' "$file"
done

echo "✅ Color update complete!"
echo "📊 Files updated: $(find '/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app/app' -name '*.tsx' -type f | wc -l | tr -d ' ')"
