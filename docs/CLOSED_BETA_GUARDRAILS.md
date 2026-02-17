# Closed Beta Guardrails

**Created**: 2026-02-17  
**Purpose**: Rules and restrictions during closed beta testing phase

---

## 1. Feature Addition Prohibition

**Principle**: No new features during closed beta

**Prohibition**: Do not add any new features or functionality

**Reason**:
- New features introduce unknown risks
- Testing scope becomes unclear
- Existing features may break
- Focus should be on stability, not expansion

**Exception**: Critical security fixes only (with team approval)

---

## 2. Frequent UI Changes Prohibition

**Principle**: Minimize UI changes during closed beta

**Prohibition**: Do not make frequent UI/UX changes

**Reason**:
- Testers need stable interface to provide feedback
- Frequent changes confuse testers
- Makes it difficult to identify real issues
- Reduces testing effectiveness

**Allowed**: Critical bug fixes that prevent usage

**Process**: Collect UI feedback, implement after beta phase

---

## 3. Immediate Fix Prohibition (Batch Fix Principle)

**Principle**: Fix issues in batches, not immediately

**Prohibition**: Do not fix issues immediately as they are reported

**Reason**:
- Immediate fixes may introduce new bugs
- Prevents understanding root causes
- Makes it difficult to track issue patterns
- Testers may report same issue multiple times

**Process**:
1. Collect all issues during beta period
2. Analyze patterns and root causes
3. Fix in batches after beta phase
4. Test fixes together before next phase

**Exception**: Critical security vulnerabilities or data loss risks

---

## 4. Excessive Explanation to Testers Prohibition

**Principle**: Let testers discover and report naturally

**Prohibition**: Do not provide excessive explanations or guidance to testers

**Reason**:
- Testers should use system naturally
- Over-guidance masks real usability issues
- Prevents discovery of unexpected problems
- Real users will not have detailed explanations

**Allowed**: Basic account creation and login instructions only

**Process**: Provide checklist, let testers explore independently

---

## 5. Revenue and Future Plans Disclosure Prohibition

**Principle**: Keep business information confidential

**Prohibition**: Do not disclose revenue models, future plans, or business strategies

**Reason**:
- Information may leak to competitors
- Testers may have conflicts of interest
- Premature disclosure can cause problems
- Focus should be on product testing, not business

**Allowed**: General feature descriptions only

**Process**: Answer questions about current features, avoid future plans

---

## 6. Judgment Without Log Verification Prohibition

**Principle**: Always check logs before making decisions

**Prohibition**: Do not make decisions or changes without verifying logs

**Reason**:
- Logs provide objective evidence
- Prevents incorrect assumptions
- Helps identify root causes
- Enables data-driven decisions

**Required Checks**:
- Server logs (Vercel/etc)
- API response logs
- Error logs
- [BETA_CLOSED_BLOCK] logs

**Process**:
1. Check logs when issue reported
2. Verify actual behavior vs reported issue
3. Make decision based on log evidence
4. Document findings

---

## 7. Perfectionism Prohibition (60-Point Operation)

**Principle**: Aim for 60 points, not 100 points

**Prohibition**: Do not try to make everything perfect

**Reason**:
- Perfectionism delays release
- 60 points is sufficient for closed beta
- Focus on critical issues only
- Iterative improvement is more effective

**60-Point Criteria**:
- Core features work (no crashes)
- Critical bugs fixed
- Security issues resolved
- Basic usability acceptable

**Not Required**:
- Perfect UI/UX
- All edge cases handled
- Complete error messages
- Comprehensive documentation

**Process**: Prioritize critical issues, defer non-critical improvements

---

## 8. Database Schema Changes Prohibition

**Principle**: Freeze database schema during closed beta

**Prohibition**: Do not change database schema or Prisma models

**Reason**:
- Schema changes risk data loss
- Migration issues can break system
- Testers' data may become invalid
- Makes rollback difficult

**Exception**: Critical security fixes only (with backup)

**Process**: Collect schema change requests, implement after beta

---

## 9. Environment Variable Changes Prohibition

**Principle**: Keep environment variables stable

**Prohibition**: Do not change production environment variables during beta

**Reason**:
- Changes may break running system
- Difficult to track what changed
- May affect all testers
- Rollback is complex

**Exception**: Critical security fixes only

**Process**: Document all changes, test in staging first

---

## 10. External Service Integration Prohibition

**Principle**: Do not integrate new external services

**Prohibition**: Do not add new external API integrations

**Reason**:
- New integrations introduce risks
- May affect existing functionality
- Difficult to test thoroughly
- Adds complexity

**Allowed**: Existing integrations (Rakuten/Amazon) maintenance only

**Process**: Add new integrations after beta phase

---

## Closed Beta Purpose

Closed Beta (3 people, ~1 week) aims to validate core functionality stability and identify critical issues before expanding to more users. The focus is on "does it work" rather than "is it perfect". Testers should use the system naturally, and we should observe real usage patterns without excessive intervention. The goal is to ensure the system is stable enough for Phase 2 (10 people) expansion, not to achieve perfection. All improvements and feature additions should be deferred until after the beta phase, with issues collected and fixed in batches.

---

## Summary

**Core Principles**:
1. Stability over features
2. Observation over intervention
3. Batch fixes over immediate fixes
4. Evidence-based decisions
5. 60-point operation (not perfection)

**Key Prohibitions**:
- No new features
- No frequent UI changes
- No immediate fixes
- No excessive guidance
- No business disclosure
- No decisions without logs
- No perfectionism

**Focus**: Collect data, observe patterns, fix in batches after beta

---

## Related Documents

- `docs/CLOSED_BETA_TEST_CHECKLIST.md` - Tester checklist
- `docs/PUBLIC_RELEASE_ROADMAP.md` - Release phases
- `docs/BETA_CLOSED_SECURITY_AUDIT.md` - Security verification
