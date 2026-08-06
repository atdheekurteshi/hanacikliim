package com.example.data

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "period_days")
data class PeriodDay(
    @PrimaryKey val dateString: String, // Formatted as "yyyy-MM-dd"
    val flow: Int,                      // 0 = none, 1 = light, 2 = medium, 3 = heavy
    val pain: Int,                      // 0 = none, 1 = mild, 2 = moderate, 3 = severe
    val mood: String,                  // e.g. "E lumtur", "E qetë", "E lodhur", "Nën tension", "Me dhimbje", "E ndjeshme"
    val symptoms: String,              // comma-separated, e.g. "Dhimbje koke,Fryrje,Dhimbjet e barkut"
    val notes: String
)

@Entity(tableName = "app_settings")
data class AppSetting(
    @PrimaryKey val key: String,
    val value: String
)

@Entity(tableName = "cycle_periods")
data class CyclePeriod(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val startDateString: String, // Formatted as "yyyy-MM-dd"
    val endDateString: String?   // Formatted as "yyyy-MM-dd", null if ongoing
)

@Dao
interface PeriodDao {
    @Query("SELECT * FROM period_days ORDER BY dateString DESC")
    fun getAllPeriodDaysFlow(): Flow<List<PeriodDay>>

    @Query("SELECT * FROM period_days ORDER BY dateString DESC")
    suspend fun getAllPeriodDays(): List<PeriodDay>

    @Query("SELECT * FROM period_days WHERE dateString = :dateString LIMIT 1")
    suspend fun getPeriodDay(dateString: String): PeriodDay?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPeriodDay(periodDay: PeriodDay)

    @Query("DELETE FROM period_days WHERE dateString = :dateString")
    suspend fun deletePeriodDay(dateString: String)

    @Query("SELECT * FROM app_settings")
    fun getAllSettingsFlow(): Flow<List<AppSetting>>

    @Query("SELECT * FROM app_settings WHERE `key` = :key LIMIT 1")
    suspend fun getSetting(key: String): AppSetting?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSetting(setting: AppSetting)

    @Query("SELECT * FROM cycle_periods ORDER BY startDateString DESC")
    fun getAllCyclePeriodsFlow(): Flow<List<CyclePeriod>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCyclePeriod(cyclePeriod: CyclePeriod)

    @Query("DELETE FROM cycle_periods WHERE id = :id")
    suspend fun deleteCyclePeriod(id: Int)
}

@Database(entities = [PeriodDay::class, AppSetting::class, CyclePeriod::class], version = 2, exportSchema = false)
abstract class HenaDatabase : RoomDatabase() {
    abstract fun periodDao(): PeriodDao
}

class PeriodRepository(private val periodDao: PeriodDao) {
    val allPeriodDays: Flow<List<PeriodDay>> = periodDao.getAllPeriodDaysFlow()
    val allSettings: Flow<List<AppSetting>> = periodDao.getAllSettingsFlow()
    val allCyclePeriods: Flow<List<CyclePeriod>> = periodDao.getAllCyclePeriodsFlow()

    suspend fun getPeriodDay(dateString: String): PeriodDay? {
        return periodDao.getPeriodDay(dateString)
    }

    suspend fun insertPeriodDay(periodDay: PeriodDay) {
        periodDao.insertPeriodDay(periodDay)
    }

    suspend fun deletePeriodDay(dateString: String) {
        periodDao.deletePeriodDay(dateString)
    }

    suspend fun getSetting(key: String): String? {
        return periodDao.getSetting(key)?.value
    }

    suspend fun insertSetting(key: String, value: String) {
        periodDao.insertSetting(AppSetting(key, value))
    }

    suspend fun insertCyclePeriod(cyclePeriod: CyclePeriod) {
        periodDao.insertCyclePeriod(cyclePeriod)
    }

    suspend fun deleteCyclePeriod(id: Int) {
        periodDao.deleteCyclePeriod(id)
    }
}
