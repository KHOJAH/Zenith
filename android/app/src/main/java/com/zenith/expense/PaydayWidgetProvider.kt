package com.zenith.expense

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class PaydayWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == "com.zenith.expense.ACTION_UPDATE_WIDGET") {
            updateAllWidgets(context)
        }
    }

    companion object {
        const val PREFS_NAME = "ZenithWidgetPrefs"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

            val rawDate = prefs.getString("payday_date_label", "SUN, SEP 27") ?: "SUN, SEP 27"
            // Clean date: remove any trailing "• Direct Deposit" and format to uppercase (e.g. "SUN, SEP 27")
            val paydayDateLabel = rawDate.replace("• Direct Deposit", "").trim().uppercase()
            val targetPaydayMs = prefs.getLong("payday_target_ms", 0L)

            val now = System.currentTimeMillis()

            val diffMs = if (targetPaydayMs > 0L) {
                if (targetPaydayMs > now) targetPaydayMs - now else 0L
            } else {
                // Realistic default countdown preview before first app sync
                (10L * 86400000L) + (23L * 3600000L) + (49L * 60000L) + 39000L
            }
            val days = diffMs / (1000 * 60 * 60 * 24)
            val hours = (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            val mins = (diffMs % (1000 * 60 * 60)) / (1000 * 60)
            val secs = (diffMs % (1000 * 60)) / 1000

            val views = RemoteViews(context.packageName, R.layout.widget_payday)

            // Header: Payday target date (e.g. SUN, SEP 27)
            views.setTextViewText(R.id.tv_payday_date, paydayDateLabel)

            // Countdown blocks (crisp uniform #FFFFFF)
            views.setTextViewText(R.id.tv_days_val, String.format("%02d", days))
            views.setTextViewText(R.id.tv_hours_val, String.format("%02d", hours))
            views.setTextViewText(R.id.tv_mins_val, String.format("%02d", mins))
            views.setTextViewText(R.id.tv_secs_val, String.format("%02d", secs))

            // Tap on widget opens MainActivity
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context,
                0,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_payday_root, pendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val ids = appWidgetManager.getAppWidgetIds(ComponentName(context, PaydayWidgetProvider::class.java))
            for (id in ids) {
                updateAppWidget(context, appWidgetManager, id)
            }
        }
    }
}
