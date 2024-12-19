package com.webwizard.expensesmanager.alarmmanager;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;
import android.os.Build;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import android.os.Handler;
import java.util.HashSet;
import java.util.Set;

public class AlarmReceiver extends BroadcastReceiver {

    private static final Set<Integer> runningEvents = new HashSet<>();
    private static final Handler handler = new Handler();

    @Override
    public void onReceive(Context context, Intent intent) {

        String eventName = intent.getStringExtra("event_name");
        String eventData = intent.getStringExtra("event_data");
        int uniqueCode = intent.getIntExtra("unique_code", -1);

        if (uniqueCode == -1) {
            Log.e("AlarmReceiver", "Invalid uniqueCode: " + uniqueCode);
            return;  // Invalid unique code, ignore this task
        }

        if (runningEvents.contains(uniqueCode)) {
            Log.d("AlarmReceiver", "Event already running for uniqueCode: " + uniqueCode);
            return;
        }
        runningEvents.add(uniqueCode);

        Log.d("AlarmReceiver", "Alarm Triggered for event: " + eventName);

        // Check for "dailyBackup" event and start service, then stop further processing
        if ("dailyBackup".equals(eventName)) {
            startService(context, eventName, eventData, uniqueCode);
            resetRunningEventAfterDelay(uniqueCode);
            return; // Stop further processing for "dailyBackup" event
        }

        // Try to emit event to React Native (for when the app is in foreground/background)
        if (isAppInForeground(context)) {
            emitEventToReactNative(context, eventName, eventData);
        } else {
            startService(context, eventName, eventData, uniqueCode);
        }

        resetRunningEventAfterDelay(uniqueCode);
    }

    private void startService(Context context, String eventName, String eventData, int uniqueCode) {
        Intent serviceIntent = new Intent(context, AlarmTaskService.class);
        serviceIntent.putExtra("event_name", eventName);
        serviceIntent.putExtra("event_data", eventData);
        serviceIntent.putExtra("unique_code", uniqueCode);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent);
        } else {
            context.startService(serviceIntent);
        }

        AlarmService.enqueueWork(context, serviceIntent);
    }

    private void emitEventToReactNative(Context context, String eventName, String eventData) {
        ReactInstanceManager reactInstanceManager = ((ReactApplication) context.getApplicationContext()).getReactNativeHost().getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();

        if (reactContext != null) {
            try {
                reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                        .emit(eventName, eventData);
                Log.d("AlarmReceiver", "Event emitted to React Native");
            } catch (Exception e) {
                Log.e("AlarmReceiver", "Error emitting event: ", e);
            }
        } else {
            Log.e("AlarmReceiver", "ReactContext is null, cannot emit event");
        }
    }

    private boolean isAppInForeground(Context context) {
        ReactNativeHost reactNativeHost = ((ReactApplication) context.getApplicationContext()).getReactNativeHost();
        ReactInstanceManager reactInstanceManager = reactNativeHost.getReactInstanceManager();
        ReactContext reactContext = reactInstanceManager.getCurrentReactContext();
        return reactContext != null && reactContext.hasActiveCatalystInstance();
    }

    private void resetRunningEventAfterDelay(int uniqueCode) {
        handler.postDelayed(() -> {
            runningEvents.remove(uniqueCode);
            Log.d("AlarmReceiver", "Removed uniqueCode from runningEvents: " + uniqueCode);
        }, 5000);
    }
}
