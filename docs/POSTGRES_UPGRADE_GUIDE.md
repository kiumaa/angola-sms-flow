# PostgreSQL Upgrade Guide

## 🎯 Purpose

This guide provides step-by-step instructions for upgrading PostgreSQL to address security patch warnings while minimizing downtime.

---

## 📊 Current State Assessment

### Check Current Version

```sql
-- Connect to your database and run:
SELECT version();

-- Check for available updates
SELECT 
  current_setting('server_version') as current_version,
  current_setting('server_version_num') as version_number;
```

### Identify Target Version

For Supabase projects:
- Check [Supabase Changelog](https://supabase.com/changelog) for latest supported version
- Typical path: PostgreSQL 15.x → 15.latest or 16.x

---

## ⏰ Planning Phase

### 1. Choose Upgrade Window

**Recommended:**
- Low-traffic period (e.g., 2-4 AM local time)
- Weekend or holiday period
- Allow 2-3 hours buffer for testing

**Downtime Estimate:**
- Small DB (<1GB): 5-10 minutes
- Medium DB (1-10GB): 10-30 minutes  
- Large DB (>10GB): 30-60 minutes

### 2. Notify Stakeholders

```
Subject: Scheduled Database Maintenance - [DATE]

Dear Team,

We will be performing a critical PostgreSQL security upgrade on:
- Date: [YYYY-MM-DD]
- Time: [HH:MM] - [HH:MM] WAT
- Expected Downtime: [X] minutes
- Reason: Security patches and performance improvements

During this time, the application may be unavailable or read-only.

Thank you for your patience.
```

### 3. Communication Plan

- [ ] Announce 1 week before
- [ ] Reminder 24 hours before
- [ ] Status page update during maintenance
- [ ] Completion notification after successful upgrade

---

## 🔧 Pre-Upgrade Steps

### 1. Complete Backup

```bash
# Set your database URL
export DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"

# Full backup with timestamp
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > "backup_${BACKUP_DATE}.sql"

# Verify backup
ls -lh backup_${BACKUP_DATE}.sql
wc -l backup_${BACKUP_DATE}.sql

# Compress for storage
gzip backup_${BACKUP_DATE}.sql
```

### 2. Document Current State

```sql
-- Save to file: pre_upgrade_state.sql

-- 1. List all extensions
SELECT 
  extname as extension_name,
  extversion as version,
  extrelocatable as relocatable
FROM pg_extension
ORDER BY extname;

-- 2. List all schemas
SELECT 
  schema_name,
  schema_owner
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
ORDER BY schema_name;

-- 3. List all tables with row counts
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  n_live_tup as estimated_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 4. List all functions
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;

-- 5. Save database settings
SHOW ALL;

-- 6. List all roles and permissions
\du
```

### 3. Test on Staging

**CRITICAL**: Always test upgrade on staging first!

```bash
# 1. Create staging project (Supabase)
# Via Dashboard: New Project → Select same region

# 2. Restore backup to staging
psql $STAGING_DATABASE_URL < backup_${BACKUP_DATE}.sql

# 3. Perform upgrade on staging (see upgrade steps below)

# 4. Run full test suite
psql $STAGING_DATABASE_URL -f tests/security_validation.sql

# 5. Test application functionality
# - Login/logout
# - CRUD operations
# - Payment processing
# - SMS sending
# - All critical flows

# 6. Performance benchmarks
# Run your typical queries and compare execution times
```

---

## 🚀 Upgrade Execution

### Option A: Supabase Managed Upgrade (Recommended)

#### Steps:

1. **Navigate to Project Settings**
   ```
   Supabase Dashboard → Your Project → Settings → Database
   ```

2. **Check Available Upgrades**
   - Look for "PostgreSQL Version" section
   - Check if upgrade is available
   - Review release notes

3. **Schedule Upgrade**
   ```
   Click "Upgrade" button
   → Select target version
   → Choose maintenance window
   → Confirm upgrade
   ```

4. **Monitor Progress**
   - Dashboard shows upgrade status
   - Typically takes 10-30 minutes
   - You'll receive email notification on completion

5. **Verify Success**
   ```sql
   SELECT version();
   -- Should show new version
   ```

### Option B: Manual Migration (If Console Upgrade Not Available)

#### Steps:

1. **Create New Project with Target Version**
   ```
   Supabase Dashboard → New Project
   → Select latest PostgreSQL version
   → Same region as current project
   ```

2. **Export from Old Project**
   ```bash
   # Export schema and data
   pg_dump \
     --no-owner \
     --no-acl \
     --clean \
     --if-exists \
     $OLD_DATABASE_URL > migration.sql
   
   # Verify export
   grep "PostgreSQL database dump" migration.sql
   ```

3. **Import to New Project**
   ```bash
   # Import to new project
   psql $NEW_DATABASE_URL -f migration.sql
   
   # Check for errors
   echo $?  # Should be 0 if successful
   ```

4. **Verify Data Integrity**
   ```sql
   -- Run on both old and new databases
   SELECT 
     schemaname,
     tablename,
     n_live_tup as row_count
   FROM pg_stat_user_tables
   ORDER BY schemaname, tablename;
   
   -- Compare outputs - should be identical
   ```

5. **Update Application Connection**
   ```bash
   # Update environment variables
   # .env or hosting platform config
   DATABASE_URL=$NEW_DATABASE_URL
   SUPABASE_URL=$NEW_SUPABASE_URL
   SUPABASE_ANON_KEY=$NEW_ANON_KEY
   
   # Deploy updated config
   # Restart application servers
   ```

6. **Switch Traffic**
   ```bash
   # Update DNS or load balancer
   # Point to new database
   # Monitor for errors
   ```

---

## ✅ Post-Upgrade Validation

### 1. Immediate Checks (First 5 Minutes)

```sql
-- Verify version
SELECT version();

-- Check all tables accessible
SELECT count(*) FROM profiles;
SELECT count(*) FROM contacts;
SELECT count(*) FROM sms_logs;

-- Verify RLS still active
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Test key functions
SELECT mask_email('test@example.com');
SELECT mask_phone('+244912345678');
SELECT has_role('some-uuid', 'admin'::app_role);
```

### 2. Comprehensive Validation (First 30 Minutes)

```bash
# Run full test suite
psql $DATABASE_URL -f tests/security_validation.sql

# Check for any errors
echo $?  # Should be 0

# Review test output
# All tests should PASS
```

### 3. Application Testing (First Hour)

**Critical User Flows:**
- [ ] User registration
- [ ] User login/logout  
- [ ] View/edit profile
- [ ] Create/edit contacts
- [ ] Send SMS (quick send)
- [ ] Create campaign
- [ ] Buy credits
- [ ] Admin functions
- [ ] Reports/analytics

### 4. Performance Validation

```sql
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM profiles WHERE user_id = 'xxx';

EXPLAIN ANALYZE
SELECT * FROM contacts WHERE account_id = 'xxx';

-- Compare with pre-upgrade baselines
-- Should be similar or better

-- Check slow queries
SELECT 
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### 5. Security Revalidation

```bash
# Re-run Supabase linter
# Via Dashboard → Database → Linter

# Should show 0 warnings for:
# - PUBLIC_USER_DATA
# - EXPOSED_SENSITIVE_DATA
# - 0011_function_search_path_mutable
# - PostgreSQL version patches
```

---

## 🔄 Rollback Procedure

### If Issues Detected Within First Hour

#### Option A: Restore from Backup (Fastest)

```bash
# 1. Stop application traffic
# Update load balancer or DNS

# 2. Drop and recreate database
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE;"
psql $DATABASE_URL -c "CREATE SCHEMA public;"

# 3. Restore from backup
gunzip -c backup_${BACKUP_DATE}.sql.gz | psql $DATABASE_URL

# 4. Verify restoration
psql $DATABASE_URL -c "SELECT version();"
psql $DATABASE_URL -c "SELECT count(*) FROM profiles;"

# 5. Restore application traffic
```

#### Option B: Revert to Old Project (Supabase)

```bash
# 1. Switch connection strings back to old project
DATABASE_URL=$OLD_DATABASE_URL
SUPABASE_URL=$OLD_SUPABASE_URL

# 2. Redeploy application with old config

# 3. Verify functionality

# 4. Keep new project for troubleshooting
# Don't delete immediately
```

### Data Synchronization (If Rollback After Activity)

If you need to rollback but there were transactions on the new database:

```bash
# 1. Export delta (new data since upgrade)
pg_dump \
  --data-only \
  --table=profiles \
  --table=contacts \
  $NEW_DATABASE_URL > delta_data.sql

# 2. Import to old database
psql $OLD_DATABASE_URL -f delta_data.sql

# 3. Resolve conflicts manually if any
```

---

## 📈 Monitoring Post-Upgrade

### First 24 Hours

```bash
# Monitor error rates
# Check application logs every 2 hours

# Monitor database metrics
# - Connection count
# - Query latency
# - Error rate
# - CPU/Memory usage

# Watch for:
# - Increased 5xx errors
# - Slow queries
# - Failed transactions
# - User complaints
```

### First Week

```sql
-- Daily checks

-- 1. Check audit logs for anomalies
SELECT 
  DATE(created_at) as date,
  action,
  count(*) as occurrences
FROM admin_audit_logs
WHERE created_at > now() - interval '24 hours'
GROUP BY DATE(created_at), action
ORDER BY date DESC, occurrences DESC;

-- 2. Monitor PII access patterns
SELECT 
  DATE(accessed_at) as date,
  table_name,
  access_type,
  count(*) as accesses
FROM pii_access_audit
WHERE accessed_at > now() - interval '24 hours'
GROUP BY DATE(accessed_at), table_name, access_type
ORDER BY date DESC, accesses DESC;

-- 3. Check for slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🎓 Lessons Learned Template

After successful upgrade, document:

```markdown
# PostgreSQL Upgrade - Lessons Learned

## Date: [YYYY-MM-DD]
## Version: [Old] → [New]

### What Went Well
- 
- 

### What Could Be Improved
- 
- 

### Unexpected Issues
- 
- 

### Resolutions
- 
- 

### Action Items for Next Time
- [ ] 
- [ ] 

### Metrics
- Planned downtime: [X] minutes
- Actual downtime: [Y] minutes
- Database size: [Z] GB
- Restoration time: [A] minutes
- Issues encountered: [B]
```

---

## 📞 Emergency Contacts

### During Upgrade

**Team Lead**: [Name] - [Phone] - [Email]  
**Database Admin**: [Name] - [Phone] - [Email]  
**DevOps**: [Name] - [Phone] - [Email]

### External Support

**Supabase Support**: https://supabase.com/support  
**Emergency Slack**: #database-emergency  
**Status Page**: https://status.supabase.com

---

## ✅ Final Checklist

Before marking upgrade as complete:

- [ ] New PostgreSQL version confirmed
- [ ] All automated tests passing
- [ ] Manual validation complete
- [ ] Application functionality verified
- [ ] Performance within acceptable range
- [ ] Security linter shows 0 warnings
- [ ] Monitoring configured and active
- [ ] Team notified of success
- [ ] Documentation updated
- [ ] Old backup retained for 30 days
- [ ] Lessons learned documented

---

**Document Version**: 1.0  
**Last Updated**: 2025-09-30  
**Maintained By**: Database Team
