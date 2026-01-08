#!/bin/bash

# VBG Security Audit Script
# Checks for security vulnerabilities and exposed sensitive data

echo "🔒 VBG Security Audit"
echo "===================="
echo ""

APP_DIR="/Users/lindsay/CascadeProjects/Veritas Building Group Web App/vbg-app"
REPORT_FILE="$APP_DIR/security-report.txt"

# Clear previous report
> "$REPORT_FILE"

echo "VBG Security Audit Report" >> "$REPORT_FILE"
echo "Generated: $(date)" >> "$REPORT_FILE"
echo "===========================================" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

issues_found=0
warnings_found=0

# 1. Check for exposed API keys and secrets
echo "🔍 Checking for exposed secrets..."
echo "" >> "$REPORT_FILE"
echo "EXPOSED SECRETS CHECK:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

# Search for common secret patterns in source files (excluding .env)
secret_patterns=(
    "api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    "password.*=.*['\"][^'\"]{8,}['\"]"
    "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    "RESEND_API_KEY"
    "TWENTY_API_KEY"
    "JWT_SECRET"
    "DATABASE_URL"
)

for pattern in "${secret_patterns[@]}"; do
    results=$(grep -r -i "$pattern" "$APP_DIR/app" "$APP_DIR/server.js" 2>/dev/null | grep -v ".env" | grep -v "node_modules" | grep -v ".next")
    if [ ! -z "$results" ]; then
        echo -e "${RED}✗ Found potential exposed secret: $pattern${NC}"
        echo "FOUND: $pattern" >> "$REPORT_FILE"
        echo "$results" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        ((issues_found++))
    fi
done

if [ $issues_found -eq 0 ]; then
    echo -e "${GREEN}✓ No exposed secrets found in source code${NC}"
    echo "No exposed secrets found" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 2. Check for console.log statements that might expose data
echo ""
echo "🔍 Checking for debug console.log statements..."
echo "" >> "$REPORT_FILE"
echo "CONSOLE.LOG STATEMENTS:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

console_logs=$(grep -r "console.log" "$APP_DIR/app" --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" | grep -v "node_modules" | wc -l)

if [ $console_logs -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $console_logs console.log statements${NC}"
    echo "Found $console_logs console.log statements" >> "$REPORT_FILE"
    
    # List files with console.log
    grep -r "console.log" "$APP_DIR/app" --include="*.tsx" --include="*.ts" -l | head -20 >> "$REPORT_FILE"
    ((warnings_found++))
else
    echo -e "${GREEN}✓ No console.log statements found${NC}"
fi

echo "" >> "$REPORT_FILE"

# 3. Check for hardcoded URLs and IPs
echo ""
echo "🔍 Checking for hardcoded URLs and IPs..."
echo "" >> "$REPORT_FILE"
echo "HARDCODED URLs/IPs:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

hardcoded=$(grep -r "http://localhost\|https://localhost\|31.97.144.132" "$APP_DIR/app" --include="*.tsx" --include="*.ts" | grep -v "node_modules" | wc -l)

if [ $hardcoded -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $hardcoded hardcoded URLs/IPs${NC}"
    echo "Found $hardcoded hardcoded URLs/IPs" >> "$REPORT_FILE"
    grep -r "http://localhost\|https://localhost\|31.97.144.132" "$APP_DIR/app" --include="*.tsx" --include="*.ts" | grep -v "node_modules" | head -10 >> "$REPORT_FILE"
    ((warnings_found++))
else
    echo -e "${GREEN}✓ No hardcoded URLs/IPs found${NC}"
fi

echo "" >> "$REPORT_FILE"

# 4. Check for missing authentication on routes
echo ""
echo "🔍 Checking for missing authentication checks..."
echo "" >> "$REPORT_FILE"
echo "AUTHENTICATION CHECKS:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

# Check if protected routes use useAuth
protected_routes=$(find "$APP_DIR/app" -name "page.tsx" | grep -v "login\|register\|verify-email\|reset-password\|services\|^\/$" | wc -l)
routes_with_auth=$(grep -l "useAuth\|authenticateAdmin\|authenticateUser" $(find "$APP_DIR/app" -name "page.tsx" | grep -v "login\|register\|verify-email\|reset-password\|services") 2>/dev/null | wc -l)

echo "Protected routes: $protected_routes"
echo "Routes with auth: $routes_with_auth"
echo "Protected routes found: $protected_routes" >> "$REPORT_FILE"
echo "Routes with authentication: $routes_with_auth" >> "$REPORT_FILE"

if [ $routes_with_auth -lt $protected_routes ]; then
    missing=$((protected_routes - routes_with_auth))
    echo -e "${YELLOW}⚠ $missing routes may be missing authentication${NC}"
    echo "WARNING: $missing routes may be missing authentication" >> "$REPORT_FILE"
    ((warnings_found++))
else
    echo -e "${GREEN}✓ All protected routes have authentication${NC}"
fi

echo "" >> "$REPORT_FILE"

# 5. Check for exposed user data in client-side code
echo ""
echo "🔍 Checking for exposed user data..."
echo "" >> "$REPORT_FILE"
echo "USER DATA EXPOSURE:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

sensitive_data=$(grep -r "password\|ssn\|social_security\|credit_card\|bank_account" "$APP_DIR/app" --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "placeholder\|label\|Password" | wc -l)

if [ $sensitive_data -gt 0 ]; then
    echo -e "${RED}✗ Found potential sensitive data exposure${NC}"
    echo "Found potential sensitive data exposure" >> "$REPORT_FILE"
    grep -r "password\|ssn\|social_security\|credit_card\|bank_account" "$APP_DIR/app" --include="*.tsx" --include="*.ts" | grep -v "node_modules" | grep -v "placeholder\|label\|Password" | head -5 >> "$REPORT_FILE"
    ((issues_found++))
else
    echo -e "${GREEN}✓ No obvious sensitive data exposure${NC}"
    echo "No obvious sensitive data exposure" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 6. Check .env file security
echo ""
echo "🔍 Checking .env file security..."
echo "" >> "$REPORT_FILE"
echo "ENV FILE SECURITY:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

if [ -f "$APP_DIR/.env" ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
    
    # Check if .env is in .gitignore
    if grep -q "^\.env$" "$APP_DIR/.gitignore" 2>/dev/null; then
        echo -e "${GREEN}✓ .env is in .gitignore${NC}"
        echo ".env is properly gitignored" >> "$REPORT_FILE"
    else
        echo -e "${RED}✗ .env is NOT in .gitignore!${NC}"
        echo "CRITICAL: .env is NOT in .gitignore" >> "$REPORT_FILE"
        ((issues_found++))
    fi
else
    echo -e "${YELLOW}⚠ No .env file found${NC}"
fi

echo "" >> "$REPORT_FILE"

# 7. Check for SQL injection vulnerabilities
echo ""
echo "🔍 Checking for SQL injection vulnerabilities..."
echo "" >> "$REPORT_FILE"
echo "SQL INJECTION CHECK:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

# Look for string concatenation in SQL queries
sql_concat=$(grep -r "db.query\|db.all\|db.get\|db.run" "$APP_DIR/server.js" 2>/dev/null | grep -v "?" | grep -v "\$1\|\$2\|\$3" | wc -l)

if [ $sql_concat -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found $sql_concat potential SQL injection points${NC}"
    echo "Found $sql_concat potential SQL injection points" >> "$REPORT_FILE"
    ((warnings_found++))
else
    echo -e "${GREEN}✓ All SQL queries use parameterized statements${NC}"
    echo "All SQL queries use parameterized statements" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 8. Check for XSS vulnerabilities
echo ""
echo "🔍 Checking for XSS vulnerabilities..."
echo "" >> "$REPORT_FILE"
echo "XSS VULNERABILITY CHECK:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

# Look for dangerouslySetInnerHTML
dangerous_html=$(grep -r "dangerouslySetInnerHTML" "$APP_DIR/app" --include="*.tsx" --include="*.jsx" | grep -v "node_modules" | wc -l)

if [ $dangerous_html -gt 0 ]; then
    echo -e "${RED}✗ Found $dangerous_html uses of dangerouslySetInnerHTML${NC}"
    echo "CRITICAL: Found $dangerous_html uses of dangerouslySetInnerHTML" >> "$REPORT_FILE"
    grep -r "dangerouslySetInnerHTML" "$APP_DIR/app" --include="*.tsx" --include="*.jsx" | grep -v "node_modules" >> "$REPORT_FILE"
    ((issues_found++))
else
    echo -e "${GREEN}✓ No dangerouslySetInnerHTML found${NC}"
    echo "No dangerouslySetInnerHTML found" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 9. Check CORS configuration
echo ""
echo "🔍 Checking CORS configuration..."
echo "" >> "$REPORT_FILE"
echo "CORS CONFIGURATION:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

if grep -q "Access-Control-Allow-Origin.*\*" "$APP_DIR/server.js" 2>/dev/null; then
    echo -e "${YELLOW}⚠ CORS allows all origins (*)${NC}"
    echo "WARNING: CORS allows all origins (*)" >> "$REPORT_FILE"
    ((warnings_found++))
else
    echo -e "${GREEN}✓ CORS is properly configured${NC}"
    echo "CORS is properly configured" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# 10. Check for exposed .env variables in client code
echo ""
echo "🔍 Checking for exposed environment variables..."
echo "" >> "$REPORT_FILE"
echo "ENVIRONMENT VARIABLES IN CLIENT:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

# Check for process.env usage in client components
client_env=$(grep -r "process\.env\." "$APP_DIR/app" --include="*.tsx" --include="*.jsx" | grep -v "NEXT_PUBLIC" | grep -v "node_modules" | wc -l)

if [ $client_env -gt 0 ]; then
    echo -e "${RED}✗ Found $client_env non-public env vars in client code${NC}"
    echo "CRITICAL: Found $client_env non-public env vars in client code" >> "$REPORT_FILE"
    grep -r "process\.env\." "$APP_DIR/app" --include="*.tsx" --include="*.jsx" | grep -v "NEXT_PUBLIC" | grep -v "node_modules" | head -10 >> "$REPORT_FILE"
    ((issues_found++))
else
    echo -e "${GREEN}✓ Only NEXT_PUBLIC env vars used in client${NC}"
    echo "Only NEXT_PUBLIC env vars used in client" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# Summary
echo ""
echo "===================="
echo "📊 Security Summary:"
echo "-------------------------------------------"
echo "" >> "$REPORT_FILE"
echo "SUMMARY:" >> "$REPORT_FILE"
echo "-------------------------------------------" >> "$REPORT_FILE"

if [ $issues_found -eq 0 ] && [ $warnings_found -eq 0 ]; then
    echo -e "${GREEN}✓ No security issues found!${NC}"
    echo "No security issues found" >> "$REPORT_FILE"
elif [ $issues_found -eq 0 ]; then
    echo -e "${YELLOW}⚠ $warnings_found warnings found${NC}"
    echo "$warnings_found warnings found" >> "$REPORT_FILE"
else
    echo -e "${RED}✗ $issues_found critical issues found${NC}"
    echo -e "${YELLOW}⚠ $warnings_found warnings found${NC}"
    echo "$issues_found critical issues found" >> "$REPORT_FILE"
    echo "$warnings_found warnings found" >> "$REPORT_FILE"
fi

echo ""
echo "Critical Issues: $issues_found" >> "$REPORT_FILE"
echo "Warnings: $warnings_found" >> "$REPORT_FILE"
echo ""
echo "📄 Full report saved to: $REPORT_FILE"
echo ""
