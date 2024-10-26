package com.webwizard.expensesmanager.alarmmanager;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.SystemClock;
import android.util.Log;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class AlarmManagerModule extends ReactContextBaseJavaModule {

    private static final String TAG = "AlarmManagerModule";
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
    public void scheduleAlarm(int timeInSeconds) {
        Log.d(TAG, "Scheduling alarm in " + timeInSeconds + " seconds");

        AlarmManager alarmManager = (AlarmManager) reactContext.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(reactContext, AlarmReceiver.class); // Make sure you have AlarmReceiver
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                reactContext,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        if (alarmManager != null) {
            alarmManager.setExact(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    SystemClock.elapsedRealtime() + timeInSeconds * 1000,
                    pendingIntent
            );
        }
    }
}
