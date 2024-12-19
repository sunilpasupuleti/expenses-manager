package com.webwizard.expensesmanager.alarmmanager;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.JobIntentService;

import com.facebook.react.HeadlessJsTaskService;

public class AlarmService extends JobIntentService {

    private static final String TAG = "AlarmService";
    private static final int JOB_ID = 1234;

    public static void enqueueWork(Context context, Intent intent) {
        enqueueWork(context, AlarmService.class, JOB_ID, intent);
    }

    @Override
    protected void onHandleWork(@NonNull Intent intent) {
        String eventName = intent.getStringExtra("event_name");
        String eventData = intent.getStringExtra("event_data");

        Log.d(TAG, "Starting Headless JS Task: " + eventName);

        // Create an intent for Headless JS
        Intent headlessIntent = new Intent(getApplicationContext(), AlarmTaskService.class);
        headlessIntent.putExtra("event_name", eventName);
        headlessIntent.putExtra("event_data", eventData);

        // Start the Headless JS task
        getApplicationContext().startService(headlessIntent);
        HeadlessJsTaskService.acquireWakeLockNow(getApplicationContext());
    }
}
