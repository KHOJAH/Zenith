package com.zenith.expense

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class ZenithWidgetModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "ZenithWidgetModule"
    }

    @ReactMethod
    fun updateCashFlowData(data: ReadableMap) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(CashFlowWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()

        if (data.hasKey("netAmount")) editor.putString("cash_flow_net", data.getString("netAmount"))
        if (data.hasKey("isNetPositive")) editor.putBoolean("cash_flow_net_positive", data.getBoolean("isNetPositive"))
        if (data.hasKey("savingsBadge")) editor.putString("cash_flow_badge", data.getString("savingsBadge"))
        if (data.hasKey("incomeAmount")) editor.putString("cash_flow_income", data.getString("incomeAmount"))
        if (data.hasKey("expenseAmount")) editor.putString("cash_flow_expense", data.getString("expenseAmount"))
        if (data.hasKey("incomeSubtext")) editor.putString("cash_flow_income_subtext", data.getString("incomeSubtext"))
        if (data.hasKey("expenseSubtext")) editor.putString("cash_flow_expense_subtext", data.getString("expenseSubtext"))
        if (data.hasKey("inflowRatio")) editor.putInt("cash_flow_inflow_ratio", data.getInt("inflowRatio"))
        if (data.hasKey("burnRatio")) editor.putInt("cash_flow_burn_ratio", data.getInt("burnRatio"))
        if (data.hasKey("dailySpend")) editor.putString("cash_flow_daily_spend", data.getString("dailySpend"))
        if (data.hasKey("pacingStatus")) editor.putString("cash_flow_pacing", data.getString("pacingStatus"))

        editor.apply()

        CashFlowWidgetProvider.updateAllWidgets(context)
    }

    @ReactMethod
    fun updatePaydayData(data: ReadableMap) {
        val context = reactApplicationContext
        val prefs = context.getSharedPreferences(PaydayWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()

        if (data.hasKey("paydayDateLabel")) editor.putString("payday_date_label", data.getString("paydayDateLabel"))
        if (data.hasKey("targetPaydayMs")) editor.putLong("payday_target_ms", data.getDouble("targetPaydayMs").toLong())
        if (data.hasKey("startCycleMs")) editor.putLong("payday_start_ms", data.getDouble("startCycleMs").toLong())
        if (data.hasKey("totalCycleDays")) editor.putInt("payday_total_days", data.getInt("totalCycleDays"))
        if (data.hasKey("estDeposit")) editor.putString("payday_est_deposit", data.getString("estDeposit"))

        editor.apply()

        PaydayWidgetProvider.updateAllWidgets(context)
    }
}
