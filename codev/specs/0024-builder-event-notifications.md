# Specification: Builder Event Notifications

## Metadata
- **ID**: 0024
- **Status**: draft
- **Created**: 2025-12-04

## Clarifying Questions Asked
<!-- Document the questions you asked the user/stakeholder and their answers -->
[Questions to be documented during specification phase]

## Problem Statement
Builders currently operate in isolation with no awareness of events happening elsewhere in the system. When an architect completes a PR review, changes files, or other significant events occur, builders have no way to know unless they actively check.

This creates friction in the architect-builder workflow where builders may continue working on outdated assumptions or miss important feedback.

## Current State
- Builders run in tmux panes with their own Claude Code sessions
- Communication is one-way: architect can send instructions via 0020 (Send Instructions to Builder)
- No event-driven notifications exist
- Builders must be manually informed of changes or PR review completion

## Desired State
When significant events occur (PR review completed, file changes, etc.), builders should receive automatic notifications via their tmux session. This enables:
- Faster response to architect feedback
- Awareness of changes that may affect their work
- More efficient architect-builder collaboration

## Stakeholders
- **Primary Users**: Builders (AI agents working on implementation)
- **Secondary Users**: Architect (benefits from faster builder response)
- **Technical Team**: Codev maintainers
- **Business Owners**: Project owner

## Success Criteria
- [ ] Builders receive notifications when PR reviews are completed
- [ ] Builders receive notifications when relevant files change
- [ ] Notification format is clear and actionable
- [ ] Notifications don't interrupt active Claude Code prompts destructively
- [ ] All tests pass with >90% coverage
- [ ] Documentation updated

## Constraints
### Technical Constraints
- Must use tmux send-keys (consistent with 0020 approach)
- Must not corrupt ongoing Claude Code sessions
- Must work within existing agent-farm architecture

### Business Constraints
- Should reuse patterns from 0020 where applicable

## Assumptions
- tmux send-keys is reliable for notification delivery
- Builders can process notifications without human intervention
- Event sources (PR review, file changes) can be detected programmatically

## Solution Approaches

### Approach 1: [TBD]
**Description**: [To be defined]

**Pros**:
- [TBD]

**Cons**:
- [TBD]

**Estimated Complexity**: [TBD]
**Risk Level**: [TBD]

## Open Questions

### Critical (Blocks Progress)
- [ ] What events should trigger notifications?
- [ ] How to detect when a PR review is "completed"?
- [ ] How to avoid corrupting active Claude Code sessions?

### Important (Affects Design)
- [ ] Should notifications be queued if builder is busy?
- [ ] What format should notifications take?
- [ ] How does this interact with 0020 (send instructions)?

### Nice-to-Know (Optimization)
- [ ] Should builders be able to configure which events they receive?

## Performance Requirements
- **Response Time**: Notifications delivered within seconds of event
- **Throughput**: N/A (event-driven)
- **Resource Usage**: Minimal overhead
- **Availability**: Same as agent-farm

## Security Considerations
- Notifications should not expose sensitive data
- Only legitimate events should trigger notifications

## Test Scenarios
### Functional Tests
1. PR review completion triggers notification to relevant builder
2. File change triggers notification
3. Notification delivered without corrupting Claude Code session

### Non-Functional Tests
1. Notification latency under various conditions
2. System behavior under rapid event bursts

## Dependencies
- **External Services**: None
- **Internal Systems**: agent-farm CLI, tmux
- **Libraries/Frameworks**: Existing agent-farm stack

## References
- codev/specs/0020-send-instructions-to-builder.md (similar approach)
- projectlist.md notes

## Risks and Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
|------|------------|--------|-------------------|
| Notification corrupts Claude session | Medium | High | Test thoroughly, use safe injection timing |
| Event detection unreliable | Medium | Medium | Start with explicit triggers, add auto-detection later |

## Expert Consultation
<!-- Only if user requested multi-agent consultation -->
**Date**: [TBD]
**Models Consulted**: [TBD]
**Sections Updated**: [TBD]

## Approval
- [ ] Technical Lead Review
- [ ] Product Owner Review
- [ ] Stakeholder Sign-off
- [ ] Expert AI Consultation Complete

## Notes
From projectlist: "Use tmux send-keys to notify builders of events. Example: architect completes PR review -> builder gets notified. Complements 0020 (instructions) with event-driven notifications."
