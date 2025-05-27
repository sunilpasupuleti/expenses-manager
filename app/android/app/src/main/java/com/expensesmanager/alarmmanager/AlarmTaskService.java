package com.webwizard.expensesmanager.alarmmanager;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import android.os.Handler;
import java.util.HashSet;
import java.util.Set;

public class AlarmTaskService extends HeadlessJsTaskService {
    private static Set<Integer> runningTasks = new HashSet<>();

    @Override
    protected HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        int uniqueCode = intent.getIntExtra("unique_code", -1);
        if (uniqueCode == -1) {
            Log.e("AlarmTaskService", "Invalid uniqueCode: " + uniqueCode);
            return null;  // Invalid unique code, ignore this task
        }

        // If the task for the unique code is already running, ignore it
        if (runningTasks.contains(uniqueCode)) {
            Log.d("AlarmTaskService", "Task already running for uniqueCode: " + uniqueCode);
            return null;
        }

        runningTasks.add(uniqueCode); 
        Log.d("AlarmTaskService", "Headless JS Task Triggered");

        Bundle extras = intent.getExtras();
        WritableMap writableMap = null;

        if (extras != null) {
            writableMap = Arguments.createMap();
            for (String key : extras.keySet()) {
                String value = extras.getString(key);
                writableMap.putString(key, value);
            }
        }

         // Reset the running state after execution or timeout
         new Handler().postDelayed(() -> {
            runningTasks.remove(uniqueCode);
            Log.d("AlarmTaskService", "Removed uniqueCode from runningTasks: " + uniqueCode);
        }, 5000);  
        
        return new HeadlessJsTaskConfig(
            "AlarmTask",  // This is the name of the task registered in JavaScript
            writableMap,  // Pass the writable map (JSON data) to the task
            5000,         // Timeout for the task
            true          // Allow the task to run in the foreground, even if the app is closed
        );
    }
}
