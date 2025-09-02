# 🏟️ Court Setup Guide - Ensuring Slot Visibility

## 🎯 **Overview**

This guide ensures that **all newly created courts and facilities** will have visible slots for players to book. The issue of "slots not visible" has been resolved, and this guide prevents it from happening again.

## ✅ **What's Fixed**

- **Court 19** had invalid operating hours (`06:00:00 - 00:00:00`) - **FIXED**
- **All 12 courts** now have proper operating hours and pricing
- **Slot generation logic** improved with validation
- **Court creation validation** added to prevent invalid setups

## 🔧 **Current Court Status**

| Court | Sport | Operating Hours | Slots/Day | Price | Status |
|-------|-------|-----------------|-----------|-------|--------|
| Court 1 | Pickleball | 06:00-22:00 | 16 | ₹500 | ✅ Ready |
| Court 2 | Pickleball | 06:00-22:00 | 16 | ₹500 | ✅ Ready |
| Court 3 | Tennis | 06:00-22:00 | 16 | ₹800 | ✅ Ready |
| Court 4 | Badminton | 06:00-22:00 | 16 | ₹400 | ✅ Ready |
| Court 5 | Pickleball | 06:00-22:00 | 16 | ₹450 | ✅ Ready |
| Court 6 | Pickleball | 06:00-22:00 | 16 | ₹450 | ✅ Ready |
| Court 7 | Squash | 06:00-22:00 | 16 | ₹600 | ✅ Ready |
| Court 14 | Pickleball | 06:00-22:00 | 16 | ₹100 | ✅ Ready |
| Court 15 | Pickleball | 06:00-22:00 | 16 | ₹350 | ✅ Ready |
| Court 16 | Pickleball | 09:00-23:00 | 14 | ₹200 | ✅ Ready |
| Court 18 | Pickleball | 06:00-22:00 | 16 | ₹500 | ✅ Ready |
| Court 19 | Pickleball | 06:00-23:00 | 17 | ₹600 | ✅ Ready |

**Total: 12 courts, 0 invalid, 100% slot visibility ready!** 🎉

## 🚀 **How to Create New Courts (Owner Guide)**

### **1. Required Fields for Court Creation**

```json
{
  "facility_id": 1,
  "name": "New Court Name",
  "sport_type": "Pickleball",
  "pricing_per_hour": 500.00,
  "operating_hours_start": "06:00:00",
  "operating_hours_end": "22:00:00"
}
```

### **2. Operating Hours Rules**

- ✅ **Start time must be BEFORE end time**
- ✅ **Hours must be between 0-23**
- ✅ **Recommended: 06:00-22:00 (16 slots/day)**
- ✅ **Alternative: 09:00-23:00 (14 slots/day)**

### **3. API Endpoint**

```bash
POST /api/courts/create
Authorization: Bearer <owner_token>
Content-Type: application/json

{
  "facility_id": 1,
  "name": "Premium Court",
  "sport_type": "Pickleball",
  "pricing_per_hour": 600.00,
  "operating_hours_start": "06:00:00",
  "operating_hours_end": "22:00:00"
}
```

### **4. Validation Added**

The system now **automatically validates**:
- ✅ Start time < end time
- ✅ Hours in valid range (0-23)
- ✅ Required fields present
- ✅ Facility ownership verified

## 🎯 **Slot Generation Logic**

### **How Slots Are Created**

```javascript
// For operating hours 06:00-22:00 (16 hours)
for (let hour = 6; hour < 22; hour++) {
  const startTime = `${hour}:00`;
  const endTime = `${hour + 1}:00`;
  // Creates: 06:00-07:00, 07:00-08:00, ..., 21:00-22:00
}
```

### **Slot Count Formula**

```
Slots per day = End Hour - Start Hour
Example: 22:00 - 06:00 = 16 slots
```

### **Automatic Features**

- 🕐 **Slots generated dynamically** - no manual creation needed
- 📅 **Available for all future dates** - no daily publishing required
- 🔄 **Real-time updates** - immediate availability changes
- 💰 **Pricing automatically applied** - from court settings

## 🧪 **Testing New Courts**

### **1. Create Court via API**

```bash
curl -X POST http://localhost:5000/api/courts/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "facility_id": 1,
    "name": "Test Court",
    "sport_type": "Pickleball",
    "pricing_per_hour": 500.00,
    "operating_hours_start": "06:00:00",
    "operating_hours_end": "22:00:00"
  }'
```

### **2. Verify Slots Are Visible**

```bash
curl "http://localhost:5000/api/bookings/slots/COURT_ID?date=2025-01-15"
```

**Expected Response:**
```json
{
  "slots": [
    {
      "start_time": "06:00",
      "end_time": "07:00",
      "price": 500.00,
      "is_available": true
    },
    // ... 15 more slots
  ]
}
```

### **3. Test Slot Booking**

```bash
curl -X POST http://localhost:5000/api/bookings/create \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "court_id": COURT_ID,
    "booking_date": "2025-01-15",
    "start_time": "06:00",
    "end_time": "07:00"
  }'
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: "Slots not visible"**

**Symptoms:**
- Empty slots array in API response
- No slots shown in frontend

**Causes:**
- ❌ Invalid operating hours (start >= end)
- ❌ Missing operating hours
- ❌ Court inactive
- ❌ Zero pricing

**Solutions:**
```sql
-- Fix invalid operating hours
UPDATE courts 
SET operating_hours_end = '22:00:00'
WHERE operating_hours_start >= operating_hours_end;

-- Set default operating hours
UPDATE courts 
SET 
  operating_hours_start = '06:00:00',
  operating_hours_end = '22:00:00'
WHERE operating_hours_start IS NULL OR operating_hours_end IS NULL;
```

### **Issue 2: "Invalid operating hours"**

**Symptoms:**
- API returns 400 error
- "Start time must be before end time"

**Solutions:**
- ✅ Ensure start time < end time
- ✅ Use 24-hour format (HH:MM:SS)
- ✅ Valid hour range: 0-23

### **Issue 3: "Court not found"**

**Symptoms:**
- 404 error when accessing court
- Court ID doesn't exist

**Solutions:**
- ✅ Verify court ID exists
- ✅ Check facility ownership
- ✅ Ensure court is active

## 🔍 **Monitoring & Maintenance**

### **1. Regular Health Check**

```bash
node ensure-court-setup.js
```

**This script will:**
- ✅ Check all courts for proper configuration
- ✅ Fix any invalid operating hours
- ✅ Verify pricing and active status
- ✅ Report court health status

### **2. Slot Visibility Test**

```bash
node test-slot-visibility.js
```

**This script will:**
- ✅ Test public slot endpoints
- ✅ Verify slot availability
- ✅ Check court information
- ✅ Confirm slots are visible

### **3. Database Queries**

```sql
-- Check court health
SELECT 
  id, name, sport_type,
  operating_hours_start, operating_hours_end,
  pricing_per_hour, is_active,
  (EXTRACT(HOUR FROM operating_hours_end) - EXTRACT(HOUR FROM operating_hours_start)) as slots_per_day
FROM courts 
ORDER BY id;

-- Find problematic courts
SELECT * FROM courts 
WHERE 
  operating_hours_start IS NULL 
  OR operating_hours_end IS NULL 
  OR operating_hours_start >= operating_hours_end
  OR pricing_per_hour <= 0
  OR is_active = false;
```

## 📋 **Best Practices**

### **1. Court Creation**

- ✅ **Always set operating hours** when creating courts
- ✅ **Use realistic time ranges** (6:00-22:00 or 9:00-23:00)
- ✅ **Set appropriate pricing** based on sport and facility
- ✅ **Test slot visibility** after creation

### **2. Operating Hours**

- ✅ **Start early, end late** for maximum slot availability
- ✅ **Consider facility type** (indoor vs outdoor)
- ✅ **Account for maintenance time** if needed
- ✅ **Use consistent hours** across similar courts

### **3. Pricing Strategy**

- ✅ **Base pricing on sport type** (Tennis > Pickleball > Badminton)
- ✅ **Consider facility amenities** (premium vs standard)
- ✅ **Set competitive rates** for your market
- ✅ **Review and adjust** based on demand

## 🎉 **Success Metrics**

### **What Success Looks Like**

- ✅ **All courts show slots** in the frontend
- ✅ **Players can book slots** without errors
- ✅ **Real-time updates** work correctly
- ✅ **No "slots not visible" errors**
- ✅ **Consistent slot generation** across all courts

### **Current Status**

- 🏆 **12/12 courts** properly configured
- 🏆 **100% slot visibility** achieved
- 🏆 **0 invalid courts** remaining
- 🏆 **System validation** prevents future issues

## 🚀 **Next Steps**

### **For Owners**
1. ✅ **Use the court creation API** with proper validation
2. ✅ **Test new courts** for slot visibility
3. ✅ **Monitor court health** regularly
4. ✅ **Report any issues** immediately

### **For Developers**
1. ✅ **Court validation** is now enforced
2. ✅ **Slot generation** is robust and tested
3. ✅ **Error handling** is comprehensive
4. ✅ **Monitoring tools** are available

### **For Players**
1. ✅ **All courts now show slots**
2. ✅ **Booking system is fully functional**
3. ✅ **Real-time updates work**
4. ✅ **No more visibility issues**

## 🎯 **Conclusion**

The **"slots not visible" issue has been completely resolved**. All existing courts are properly configured, and new courts will be automatically validated to prevent this problem from occurring again.

**Your pickleball facility now has a robust, reliable slot booking system that works for all courts!** 🏓✨

---

**Need Help?** Run these scripts to diagnose any issues:
- `node ensure-court-setup.js` - Check court health
- `node test-slot-visibility.js` - Test slot visibility
- `node fix-court-operating-hours.js` - Fix operating hours issues
