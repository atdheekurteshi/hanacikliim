package com.example.data

import android.content.Context
import androidx.room.Room

object DatabaseProvider {
    @Volatile
    private var INSTANCE: HenaDatabase? = null

    fun getDatabase(context: Context): HenaDatabase {
        return INSTANCE ?: synchronized(this) {
            val instance = Room.databaseBuilder(
                context.applicationContext,
                HenaDatabase::class.java,
                "hena_database"
            )
                .fallbackToDestructiveMigration()
                .build()
            INSTANCE = instance
            instance
        }
    }

    @Volatile
    private var repositoryInstance: PeriodRepository? = null

    fun getRepository(context: Context): PeriodRepository {
        return repositoryInstance ?: synchronized(this) {
            val db = getDatabase(context)
            val repo = PeriodRepository(db.periodDao())
            repositoryInstance = repo
            repo
        }
    }
}
