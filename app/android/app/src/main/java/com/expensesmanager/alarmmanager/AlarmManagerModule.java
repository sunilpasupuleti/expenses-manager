package com.webwizard.expensesmanager.alarmmanager;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import java.util.HashMap;
import java.util.Calendar;


public class AlarmManagerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public AlarmManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

    }

    @Override
    public String getName() {
        return "AlarmManagerModule";
    }


    @ReactMethod
    public void scheduleAlarm(double timeInMillis, String eventName, String eventData, int uniqueCode) {
        AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(reactContext, AlarmReceiver.class);
        intent.putExtra("event_name", eventName);
        intent.putExtra("event_data", eventData);
        intent.putExtra("unique_code", uniqueCode);


        PendingIntent pendingIntent = PendingIntent.getBroadcast(
            reactContext,
            uniqueCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        alarmManager.setExactAndAllowWhileIdle(
            AlarmManager.RTC_WAKEUP,
            (long) timeInMillis,
            pendingIntent
        );
        Log.d("AlarmManagerModule", "Alarm scheduled for: " + timeInMillis + " with uniqueCode: " + uniqueCode);
    }
}
