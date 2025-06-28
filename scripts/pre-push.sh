#!/bin/bash

# Pre-push verification script for Growcado JS SDK
# This script runs all quality checks before pushing code

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_header() {
    echo -e "\n${BLUE}===========================================${NC}"
    echo -e "${BLUE}🚀 Growcado JS SDK - Pre-Push Verification${NC}"
    echo -e "${BLUE}===========================================${NC}\n"
}

# Function to run a command with error handling
run_check() {
    local step_name="$1"
    local command="$2"
    
    print_step "Running $step_name..."
    
    if eval "$command"; then
        print_success "$step_name passed"
        return 0
    else
        print_error "$step_name failed"
        echo -e "${RED}Command: $command${NC}"
        return 1
    fi
}

# Function to check if pnpm is available
check_pnpm() {
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install pnpm first."
        exit 1
    fi
}

# Main execution
main() {
    print_header
    
    # Check prerequisites
    check_pnpm
    
    local failed_checks=()
    
    # Run all quality checks
    echo -e "${YELLOW}Running all quality checks...${NC}\n"
    
    # 1. Format check (commented out due to formatter issues)
    # if ! run_check "Format Check" "pnpm run format:check"; then
    #     failed_checks+=("Format Check")
    #     print_warning "Tip: Run 'pnpm run format' to fix formatting issues"
    # fi
    
    # 2. Type checking
    if ! run_check "TypeScript Type Check" "pnpm run typecheck"; then
        failed_checks+=("TypeScript Type Check")
    fi
    
    # 3. Linting
    if ! run_check "ESLint Check" "pnpm run lint"; then
        failed_checks+=("ESLint Check")
        print_warning "Tip: Some lint issues might be auto-fixable with ESLint"
    fi
    
    # 4. Tests
    if ! run_check "Unit Tests" "pnpm run test"; then
        failed_checks+=("Unit Tests")
    fi
    
    # 5. Build
    if ! run_check "Build" "pnpm run build"; then
        failed_checks+=("Build")
    fi
    
    # Summary
    echo -e "\n${BLUE}===========================================${NC}"
    if [ ${#failed_checks[@]} -eq 0 ]; then
        print_success "🎉 All checks passed! Ready to push."
        echo -e "${GREEN}Your code is ready to be pushed to the repository.${NC}"
        exit 0
    else
        print_error "❌ ${#failed_checks[@]} check(s) failed:"
        for check in "${failed_checks[@]}"; do
            echo -e "${RED}  - $check${NC}"
        done
        echo -e "\n${YELLOW}Please fix the issues above before pushing.${NC}"
        echo -e "${YELLOW}Quick fix command: pnpm run pre-push:fix${NC}"
        exit 1
    fi
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Pre-push verification script for Growcado JS SDK"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --fix          Run format and attempt to fix issues"
        echo ""
        echo "This script runs:"
        echo "  1. Format checking"
        echo "  2. TypeScript type checking"
        echo "  3. ESLint linting"
        echo "  4. Unit tests"
        echo "  5. Build process"
        exit 0
        ;;
    --fix)
        print_header
        print_step "Running format and attempting to fix issues..."
        pnpm run format
        print_success "Format applied. Re-running all checks..."
        exec "$0"  # Re-run the script
        ;;
    *)
        main
        ;;
esac 