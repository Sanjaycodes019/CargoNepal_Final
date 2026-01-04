# Automatic Truck Availability System

This document explains the automatic truck availability management system that handles expired bookings and updates truck status accordingly.

## 🚚 Features

### 1. **Automatic Booking Expiration**
- When a booking's `endTime` passes, the system automatically:
  - Marks the booking as `completed`
  - Sets the truck to `available` if no other active bookings exist
  - Logs all actions for audit purposes

### 2. **Enhanced Truck Status Display**
- Trucks now show detailed status messages:
  - `Available` - Truck is ready for bookings
  - `Booked till [Date]` - Truck is booked until specific date
  - `Owner turned off truck` - Owner manually disabled truck
  - `Error` - System error checking status

### 3. **Manual Completion Support**
- When owners mark trips as completed before the scheduled end time
- System immediately makes truck available if no other active bookings

## 🛠️ Implementation

### Backend Components

#### 1. **Scheduled Jobs Service** (`services/scheduledJobsService.js`)
- `updateExpiredBookings()` - Main function to process expired bookings
- `getEnhancedTruckStatus()` - Get detailed truck status with booking info

#### 2. **API Endpoints**
- `POST /api/bookings/scheduled-job/update-expired` - Run scheduled job (admin only)
- `GET /api/bookings/truck-status/:truckId` - Get enhanced truck status

#### 3. **Database Changes**
- Booking model already has auto-availability hooks
- Truck model has `ownerTurnedOff` field for manual control

### Frontend Components

#### 1. **Enhanced TruckCard** (`components/dashboard/owner/TruckCard.jsx`)
- Fetches enhanced status from API
- Shows "Booked till [Date]" message
- Updates button text based on actual availability

## ⚙️ Setup & Usage

### 1. **Manual Execution**
```bash
# Run the scheduled job manually
npm run scheduled-job
```

### 2. **API Trigger** (Admin only)
```bash
# Trigger via API endpoint
POST /api/bookings/scheduled-job/update-expired
Authorization: Bearer <admin-token>
```

### 3. **Cron Job Setup** (Production)
```bash
# Add to crontab to run every hour
0 * * * * cd /path/to/backend && npm run scheduled-job

# Or every 30 minutes for more frequent updates
*/30 * * * * cd /path/to/backend && npm run scheduled-job
```

## 📊 How It Works

### 1. **Booking Expiration Logic**
```
Current Time > Booking End Time?
    ↓ YES
Booking Status = "completed"
Check for other active bookings for this truck?
    ↓ NO OTHER BOOKINGS
Truck.available = true
```

### 2. **Enhanced Status Logic**
```
Truck Status Check:
1. Is ownerTurnedOff? → "Owner turned off truck"
2. Is available? → "Available"
3. Has active bookings? → "Booked till [endDate]"
4. Booking expired? → "Available" (auto-fix)
```

### 3. **Manual Completion Flow**
```
Owner clicks "Complete Trip"
↓
Booking Status = "completed"
↓
Check other active bookings
↓
No other bookings → Truck.available = true
```

## 🔧 Configuration

### Environment Variables
No additional environment variables required.

### Logging
All actions are logged with:
- Job execution details
- Booking updates
- Truck availability changes
- Error tracking

## 🚨 Important Notes

1. **Idempotent Operations**: The scheduled job can be run multiple times safely
2. **Race Conditions**: System handles concurrent booking updates
3. **Data Integrity**: All changes are atomic and rolled back on errors
4. **Performance**: Optimized queries with proper indexing

## 🐛 Troubleshooting

### Common Issues

1. **Truck not becoming available after booking ends**
   - Check if there are other active bookings
   - Run the scheduled job manually
   - Check logs for errors

2. **Status showing incorrectly**
   - Clear browser cache
   - Check API endpoint `/api/bookings/truck-status/:truckId`
   - Verify booking dates are correct

3. **Scheduled job not working**
   - Check MongoDB connection
   - Verify booking dates are in the past
   - Check logs for error messages

### Debug Commands
```bash
# Check specific truck status
curl -H "Authorization: Bearer <token>" \
     http://localhost:5000/api/bookings/truck-status/<truckId>

# Run job with debug output
DEBUG=* npm run scheduled-job
```

## 📈 Monitoring

### Key Metrics to Monitor
- Number of expired bookings processed
- Trucks automatically made available
- Job execution time
- Error rates

### Sample Log Output
```
INFO: SCHEDULED_JOB_START { job: 'updateExpiredBookings' }
INFO: EXPIRED_BOOKINGS_FOUND { count: 5, currentTime: '2024-01-04T10:00:00.000Z' }
INFO: BOOKING_AUTO_COMPLETED { bookingId: '507f1f77bcf86cd799439011', truckId: '507f1f77bcf86cd799439012' }
INFO: TRUCK_AUTO_AVAILABLE { truckId: '507f1f77bcf86cd799439012', reason: 'booking_expired_no_other_active_bookings' }
INFO: SCHEDULED_JOB_COMPLETE { expiredBookingsProcessed: 5, trucksUpdated: 3 }
```

## 🔄 Future Enhancements

1. **Real-time Updates**: WebSocket integration for instant status updates
2. **Smart Scheduling**: ML-based prediction of booking completion times
3. **Owner Notifications**: SMS/email alerts when trucks become available
4. **Analytics Dashboard**: Visual representation of availability patterns
