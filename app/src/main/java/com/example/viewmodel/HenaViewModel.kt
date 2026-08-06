package com.example.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.data.DatabaseProvider
import com.example.data.PeriodDay
import com.example.data.CyclePeriod
import com.example.data.PeriodRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

class HenaViewModel(private val repository: PeriodRepository) : ViewModel() {

    // Current date selected by user for viewing/logging
    private val _selectedDate = MutableStateFlow(LocalDate.now())
    val selectedDate: StateFlow<LocalDate> = _selectedDate.asStateFlow()

    // Stream of logged period days from DB
    val allPeriodDays: StateFlow<List<PeriodDay>> = repository.allPeriodDays
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Stream of logged cycle periods (start & end dates)
    val allCyclePeriods: StateFlow<List<CyclePeriod>> = repository.allCyclePeriods
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Stream of application settings from DB
    val allSettings: StateFlow<Map<String, String>> = repository.allSettings
        .combine(MutableStateFlow(emptyMap<String, String>())) { settingsList, _ ->
            settingsList.associate { it.key to it.value }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyMap())

    // UI state derived from settings and logs
    val username: StateFlow<String> = repository.allSettings
        .combine(MutableStateFlow("Vajzë")) { list, _ ->
            list.firstOrNull { it.key == "username" }?.value ?: "Vajzë"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "Vajzë")

    val cycleLength: StateFlow<Int> = repository.allSettings
        .combine(MutableStateFlow(28)) { list, _ ->
            list.firstOrNull { it.key == "cycle_length" }?.value?.toIntOrNull() ?: 28
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 28)

    val periodLength: StateFlow<Int> = repository.allSettings
        .combine(MutableStateFlow(5)) { list, _ ->
            list.firstOrNull { it.key == "period_length" }?.value?.toIntOrNull() ?: 5
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 5)

    val lastPeriodStart: StateFlow<String> = repository.allSettings
        .combine(MutableStateFlow("")) { list, _ ->
            list.firstOrNull { it.key == "last_period_start" }?.value ?: ""
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    // PIN State Management
    val isPinEnabled: StateFlow<Boolean> = repository.allSettings
        .combine(MutableStateFlow(false)) { list, _ ->
            list.firstOrNull { it.key == "pin_enabled" }?.value == "true"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    val pinCode: StateFlow<String> = repository.allSettings
        .combine(MutableStateFlow("")) { list, _ ->
            list.firstOrNull { it.key == "pin_code" }?.value ?: ""
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")

    private val _isUnlocked = MutableStateFlow(false)
    val isUnlocked: StateFlow<Boolean> = _isUnlocked.asStateFlow()

    // Reminder State Management
    val remindPeriod: StateFlow<Boolean> = repository.allSettings
        .combine(MutableStateFlow(true)) { list, _ ->
            list.firstOrNull { it.key == "remind_period" }?.value != "false"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val remindFertile: StateFlow<Boolean> = repository.allSettings
        .combine(MutableStateFlow(true)) { list, _ ->
            list.firstOrNull { it.key == "remind_fertile" }?.value != "false"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val remindDaily: StateFlow<Boolean> = repository.allSettings
        .combine(MutableStateFlow(true)) { list, _ ->
            list.firstOrNull { it.key == "remind_daily" }?.value != "false"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), true)

    val remindWater: StateFlow<Boolean> = repository.allSettings
        .combine(MutableStateFlow(false)) { list, _ ->
            list.firstOrNull { it.key == "remind_water" }?.value == "true"
        }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)

    // Selected day's log if it exists
    val selectedPeriodDay: StateFlow<PeriodDay?> = combine(selectedDate, allPeriodDays) { date, logs ->
        val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        logs.firstOrNull { it.dateString == dateStr }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    init {
        // Pre-populate some settings if empty
        viewModelScope.launch {
            if (repository.getSetting("username") == null) {
                repository.insertSetting("username", "Vajzë")
            }
            if (repository.getSetting("cycle_length") == null) {
                repository.insertSetting("cycle_length", "28")
            }
            if (repository.getSetting("period_length") == null) {
                repository.insertSetting("period_length", "5")
            }
            // Set initial reference date to 5 days ago if not exists
            if (repository.getSetting("last_period_start") == null) {
                val initialStart = LocalDate.now().minusDays(10).format(DateTimeFormatter.ISO_LOCAL_DATE)
                repository.insertSetting("last_period_start", initialStart)
            }
        }
    }

    fun selectDate(date: LocalDate) {
        _selectedDate.value = date
    }

    fun navigateMonth(delta: Long) {
        _selectedDate.value = _selectedDate.value.plusMonths(delta)
    }

    fun saveLog(flow: Int, pain: Int, mood: String, symptoms: List<String>, notes: String) {
        viewModelScope.launch {
            val dateStr = _selectedDate.value.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val log = PeriodDay(
                dateString = dateStr,
                flow = flow,
                pain = pain,
                mood = mood,
                symptoms = symptoms.joinToString(","),
                notes = notes
            )
            repository.insertPeriodDay(log)

            // If log has heavy/medium flow, we can optionally treat this as a potential period start
            // and update last_period_start if it is earlier or represents a new cycle.
            if (flow > 0) {
                // If the user is logging a flow on this day, we should evaluate if we update last period start.
                val existingStartStr = repository.getSetting("last_period_start")
                if (existingStartStr.isNullOrEmpty()) {
                    repository.insertSetting("last_period_start", dateStr)
                } else {
                    val existingStart = LocalDate.parse(existingStartStr)
                    val currentLogDate = _selectedDate.value
                    // If logged flow is after or equal to existing start but not too far (e.g., inside 1-2 periods),
                    // or if it's more than 15 days after, let the user manually confirm, or update dynamically:
                    if (currentLogDate.isBefore(existingStart)) {
                        repository.insertSetting("last_period_start", dateStr)
                    }
                }
            }
        }
    }

    fun deleteLog(dateStr: String) {
        viewModelScope.launch {
            repository.deletePeriodDay(dateStr)
        }
    }

    fun saveCyclePeriod(startDate: LocalDate, endDate: LocalDate?) {
        viewModelScope.launch {
            val startStr = startDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val endStr = endDate?.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val cycle = CyclePeriod(
                startDateString = startStr,
                endDateString = endStr
            )
            repository.insertCyclePeriod(cycle)
            
            // Align the last_period_start settings key with this cycle start date if appropriate
            val currentLastStart = repository.getSetting("last_period_start")
            if (currentLastStart.isNullOrEmpty() || startDate.isAfter(LocalDate.parse(currentLastStart))) {
                repository.insertSetting("last_period_start", startStr)
            }
        }
    }

    fun updateCyclePeriod(id: Int, startDate: LocalDate, endDate: LocalDate?) {
        viewModelScope.launch {
            val startStr = startDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val endStr = endDate?.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val cycle = CyclePeriod(
                id = id,
                startDateString = startStr,
                endDateString = endStr
            )
            repository.insertCyclePeriod(cycle)
            
            // Also align last_period_start key
            val currentLastStart = repository.getSetting("last_period_start")
            if (currentLastStart.isNullOrEmpty() || startDate.isAfter(LocalDate.parse(currentLastStart))) {
                repository.insertSetting("last_period_start", startStr)
            }
        }
    }

    fun deleteCyclePeriod(id: Int) {
        viewModelScope.launch {
            repository.deleteCyclePeriod(id)
        }
    }

    fun updateSettings(name: String, cLength: Int, pLength: Int, lastStartStr: String) {
        viewModelScope.launch {
            repository.insertSetting("username", name.trim().ifEmpty { "Vajzë" })
            repository.insertSetting("cycle_length", cLength.coerceIn(15, 45).toString())
            repository.insertSetting("period_length", pLength.coerceIn(2, 10).toString())
            if (lastStartStr.isNotEmpty()) {
                repository.insertSetting("last_period_start", lastStartStr)
            }
        }
    }

    fun updateReminderSetting(key: String, enabled: Boolean) {
        viewModelScope.launch {
            repository.insertSetting(key, enabled.toString())
        }
    }

    fun updateSetting(key: String, value: String) {
        viewModelScope.launch {
            repository.insertSetting(key, value)
        }
    }

    fun unlockWithPin(enteredPin: String): Boolean {
        if (enteredPin == pinCode.value) {
            _isUnlocked.value = true
            return true
        }
        return false
    }

    fun lockApp() {
        _isUnlocked.value = false
    }

    fun savePin(pin: String) {
        viewModelScope.launch {
            repository.insertSetting("pin_code", pin)
            repository.insertSetting("pin_enabled", "true")
            _isUnlocked.value = true
        }
    }

    fun disablePin() {
        viewModelScope.launch {
            repository.insertSetting("pin_enabled", "false")
            repository.insertSetting("pin_code", "")
            _isUnlocked.value = false
        }
    }

    fun togglePeriodStartToday() {
        viewModelScope.launch {
            val todayStr = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
            repository.insertSetting("last_period_start", todayStr)
            // Log code flow = 2 (medium) for today
            val existing = repository.getPeriodDay(todayStr)
            val log = PeriodDay(
                dateString = todayStr,
                flow = 2,
                pain = 1,
                mood = "🌸 E qetë",
                symptoms = "Dhimbje barku",
                notes = "Cikli filloi sot!"
            )
            repository.insertPeriodDay(log)
        }
    }

    // --- Helper calculations for state variables ---

    // Get calculated cycle details
    data class CycleState(
        val cycleDay: Int,
        val phaseName: String,
        val phaseDescription: String,
        val nextPeriodDaysLeft: Int,
        val nextPeriodDateFormatted: String,
        val ovulationDayLeft: Int,
        val isFertile: Boolean,
        val colorHex: String
    )

    fun getCycleState(today: LocalDate = LocalDate.now()): CycleState {
        val lastStartStr = lastPeriodStart.value
        val cLen = cycleLength.value
        val pLen = periodLength.value

        if (lastStartStr.isEmpty()) {
            return CycleState(
                cycleDay = 0,
                phaseName = "E pa konfiguruar",
                phaseDescription = "Regjistroni datën e fundit të periodave te parametrat.",
                nextPeriodDaysLeft = 0,
                nextPeriodDateFormatted = "-",
                ovulationDayLeft = 0,
                isFertile = false,
                colorHex = "#9CA3AF"
            )
        }

        val lastStart = try {
            LocalDate.parse(lastStartStr)
        } catch (e: Exception) {
            LocalDate.now()
        }

        val daysBetween = ChronoUnit.DAYS.between(lastStart, today)
        
        // Menstrual cycles recur every `cLen` days.
        val cycleDay = if (daysBetween >= 0) {
            ((daysBetween % cLen).toInt()) + 1
        } else {
            // Future initial date or negative math:
            val absDays = Math.abs(daysBetween)
            val rem = (absDays % cLen).toInt()
            if (rem == 0) 1 else cLen - rem + 1
        }

        // Ovulation is usually 14 days before the end of the cycle
        val ovulationDay = cLen - 14
        val fertileStart = ovulationDay - 3
        val fertileEnd = ovulationDay + 1

        var phaseName = ""
        var phaseDescription = ""
        var colorHex = ""
        var isFertile = false

        when {
            cycleDay in 1..pLen -> {
                phaseName = "Faza Menstruale"
                phaseDescription = "Trupi juaj po pastrohet. Çlodhuni, pini çaj të ngrohtë dhe bëni kujdes për higjenën."
                colorHex = "#E11D48" // Rose 600
            }
            cycleDay in (pLen + 1) until fertileStart -> {
                phaseName = "Faza Folikulare"
                phaseDescription = "Nivelet e estrogjenit po rriten. Ndjeni më shumë energji, përqendrim dhe kreativitet."
                colorHex = "#8B5CF6" // Violet 500
            }
            cycleDay in fertileStart..fertileEnd -> {
                phaseName = "Faza Ovuluese"
                phaseDescription = "Ditët tuaja më pjellore! Fertilitet i lartë, lëkurë e shndritshme dhe humor i shkëlqyer."
                colorHex = "#F59E0B" // Amber 500
                isFertile = true
            }
            else -> {
                phaseName = "Faza Luteale"
                phaseDescription = "Nis rritja e progesteronit. Mund të keni shenja të PMS. Praktikoni vetëkujdesin dhe ngadalësoni ritmin."
                colorHex = "#EC4899" // Pink 500
            }
        }

        // Days left to next period
        val daysToNext = if (cycleDay <= cLen) {
            cLen - cycleDay + 1
        } else {
            cLen
        }

        val nextPeriodDate = today.plusDays(daysToNext.toLong())
        val nextPeriodDateFormatted = formatToAlbanianDate(nextPeriodDate)

        // Days left to ovulation
        val daysToOvulation = when {
            cycleDay < ovulationDay -> ovulationDay - cycleDay
            cycleDay == ovulationDay -> 0
            else -> (cLen - cycleDay) + ovulationDay
        }

        return CycleState(
            cycleDay = cycleDay,
            phaseName = phaseName,
            phaseDescription = phaseDescription,
            nextPeriodDaysLeft = daysToNext,
            nextPeriodDateFormatted = nextPeriodDateFormatted,
            ovulationDayLeft = daysToOvulation,
            isFertile = isFertile,
            colorHex = colorHex
        )
    }

    // Static Albanian utility to format Dates
    fun formatToAlbanianDate(date: LocalDate): String {
        val daysOfWeek = mapOf(
            "MONDAY" to "E Hënë",
            "TUESDAY" to "E Martë",
            "WEDNESDAY" to "E Mërkurë",
            "THURSDAY" to "E Enjte",
            "FRIDAY" to "E Premte",
            "SATURDAY" to "E Shtunë",
            "SUNDAY" to "E Diel"
        )

        val months = mapOf(
            1 to "Janar",
            2 to "Shkurt",
            3 to "Mars",
            4 to "Prill",
            5 to "Maj",
            6 to "Qershor",
            7 to "Korrik",
            8 to "Gusht",
            9 to "Shtator",
            10 to "Tetor",
            11 to "Nëntor",
            12 to "Dhjetor"
        )

        val dayName = daysOfWeek[date.dayOfWeek.name] ?: ""
        val monthName = months[date.monthValue] ?: ""
        return "$dayName, ${date.dayOfMonth} $monthName"
    }

    fun getMonthYearAlbanian(date: LocalDate): String {
        val months = mapOf(
            1 to "Janar",
            2 to "Shkurt",
            3 to "Mars",
            4 to "Prill",
            5 to "Maj",
            6 to "Qershor",
            7 to "Korrik",
            8 to "Gusht",
            9 to "Shtator",
            10 to "Tetor",
            11 to "Nëntor",
            12 to "Dhjetor"
        )
        val monthName = months[date.monthValue] ?: ""
        return "$monthName ${date.year}"
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(HenaViewModel::class.java)) {
                @Suppress("UNCHECKED_CAST")
                return HenaViewModel(DatabaseProvider.getRepository(context)) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
