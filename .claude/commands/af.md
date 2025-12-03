# Agent Farm Quick Reference

## Setup Alias
```bash
alias af='./codev/bin/agent-farm'
```

## Common Commands
```bash
af start              # Start architect dashboard
af stop               # Stop all processes
af status             # Check all agent status
af spawn -p 0003      # Spawn builder for spec 0003
af cleanup -p 0003    # Clean up builder (safe)
af cleanup -p 0003 -f # Force cleanup
af util               # Open utility shell
af annotate file.ts   # Annotate file for review
af ports list         # List port allocations
```

## Configuration
Edit `codev/config.json` to customize commands.
