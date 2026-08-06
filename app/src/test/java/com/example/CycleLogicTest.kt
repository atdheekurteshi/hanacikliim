package com.example

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.LocalDate
import java.time.temporal.ChronoUnit

class CycleLogicTest {

    @Test
    fun `calculate cycle day correctly from start date`() {
        val startDate = LocalDate.of(2026, 8, 1)
        val today = LocalDate.of(2026, 8, 5)

        val cycleDay = ChronoUnit.DAYS.between(startDate, today) + 1
        assertEquals(5L, cycleDay)
    }

    @Test
    fun `calculate next period start date given cycle length`() {
        val lastStart = LocalDate.of(2026, 8, 1)
        val cycleLength = 28

        val nextPeriodStart = lastStart.plusDays(cycleLength.toLong())
        assertEquals(LocalDate.of(2026, 8, 29), nextPeriodStart)
    }

    @Test
    fun `calculate fertile window correctly`() {
        val lastStart = LocalDate.of(2026, 8, 1)
        val cycleLength = 28

        // Ovulation is approximately 14 days before next period
        val nextStart = lastStart.plusDays(cycleLength.toLong())
        val ovulationDay = nextStart.minusDays(14) // Aug 15
        val fertileStart = ovulationDay.minusDays(5) // Aug 10
        val fertileEnd = ovulationDay.plusDays(1) // Aug 16

        assertEquals(LocalDate.of(2026, 8, 15), ovulationDay)
        assertEquals(LocalDate.of(2026, 8, 10), fertileStart)
        assertEquals(LocalDate.of(2026, 8, 16), fertileEnd)

        // Check if Aug 12 falls in fertile window
        val testDate = LocalDate.of(2026, 8, 12)
        val isFertile = !testDate.isBefore(fertileStart) && !testDate.isAfter(fertileEnd)
        assertTrue(isFertile)

        // Check if Aug 20 is outside fertile window
        val nonFertileDate = LocalDate.of(2026, 8, 20)
        val isNonFertile = !nonFertileDate.isBefore(fertileStart) && !nonFertileDate.isAfter(fertileEnd)
        assertFalse(isNonFertile)
    }

    @Test
    fun `calculate logged cycle duration in days`() {
        val start = LocalDate.of(2026, 7, 10)
        val end = LocalDate.of(2026, 7, 15)

        val durationDays = ChronoUnit.DAYS.between(start, end) + 1
        assertEquals(6L, durationDays)
    }

    @Test
    fun `calculate average cycle length from historical cycle start dates`() {
        val cycleStarts = listOf(
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 5, 29), // 28 days
            LocalDate.of(2026, 6, 27), // 29 days
            LocalDate.of(2026, 7, 24)  // 27 days
        )

        val diffs = (0 until cycleStarts.size - 1).map { i ->
            ChronoUnit.DAYS.between(cycleStarts[i], cycleStarts[i + 1]).toInt()
        }

        val avgLength = diffs.average().toInt()
        assertEquals(28, avgLength)
    }

    @Test
    fun `water intake percentage calculation`() {
        val currentMl = 1500
        val targetMl = 2000
        val percentage = (currentMl.toFloat() / targetMl.toFloat() * 100).toInt()

        assertEquals(75, percentage)
    }
}
