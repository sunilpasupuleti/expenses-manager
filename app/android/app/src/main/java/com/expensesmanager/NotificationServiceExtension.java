package com.webwizard.expensesmanager;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import androidx.annotation.Keep;
import com.onesignal.notifications.IDisplayableMutableNotification;
import com.onesignal.notifications.INotificationReceivedEvent;
import com.onesignal.notifications.INotificationServiceExtension;
import com.webwizard.expensesmanager.alarmmanager.AlarmReceiver;

@Keep
public class NotificationServiceExtension implements INotificationServiceExtension {

   @Override
   public void onNotificationReceived(INotificationReceivedEvent event) {
      IDisplayableMutableNotification notification = event.getNotification();
      Context context = event.getContext();

      Log.d("NotificationService", "Notification received with title: " + notification.getTitle());
      Log.d("NotificationService", "Notification body: " + notification.getBody());

      if (notification.getAdditionalData() != null) {
         String additionalData = notification.getAdditionalData().toString();
         String uniqueCode = notification.getAdditionalData().optString("uniqueCode", null);
         Log.d("NotificationService", "Notification additional data: " + additionalData + "uid - " + uniqueCode);

            if (uniqueCode != null && !uniqueCode.isEmpty()) {
               Log.d("NotificationService", "Scheduling backup task with AlarmManager.");
               scheduleBackupAlarm(context, additionalData, uniqueCode);
            } else {
               Log.d("NotificationService", "No uniqueCode found, not scheduling backup alarm.");
            }

      } else {
         Log.d("NotificationService", "No additional data found in notification.");
      }

      // Optionally, display the notification
      notification.display();
   }

   private void scheduleBackupAlarm(Context context, String eventData, String uniqueCode) {
      AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
      Intent intent = new Intent(context, AlarmReceiver.class);
      intent.putExtra("event_name", "dailyBackup");
      intent.putExtra("event_data", eventData);
      intent.putExtra("unique_code", uniqueCode.hashCode());

      PendingIntent pendingIntent = PendingIntent.getBroadcast(
              context,
              uniqueCode.hashCode(),
              intent,
              PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
      );

      long triggerAtMillis = System.currentTimeMillis() + 5000; // Schedule after 5 seconds

      if (alarmManager != null) {
         alarmManager.setExactAndAllowWhileIdle(
                 AlarmManager.RTC_WAKEUP,
                 triggerAtMillis,
                 pendingIntent
         );
         Log.d("NotificationService", "Alarm scheduled to trigger backup task in 5 seconds.");
      }
   }
}
