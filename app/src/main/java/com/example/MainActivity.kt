package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.material.icons.filled.Lock
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.data.PeriodDay
import com.example.data.CyclePeriod
import com.example.ui.theme.*
import com.example.viewmodel.HenaViewModel
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.widget.Toast
import androidx.core.app.NotificationCompat

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                HenaApp()
            }
        }
    }
}

fun createNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val name = "Përkujtuesit e Hënës"
        val descriptionText = "Njoftimet për ciklin menstrual, ditët pjellore dhe ditarin"
        val importance = NotificationManager.IMPORTANCE_HIGH
        val channel = NotificationChannel("hena_channel_id", name, importance).apply {
            description = descriptionText
        }
        val notificationManager: NotificationManager =
            context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)
    }
}

fun triggerLocalNotification(context: Context, title: String, content: String) {
    createNotificationChannel(context)
    val builder = NotificationCompat.Builder(context, "hena_channel_id")
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle(title)
        .setContentText(content)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setAutoCancel(true)

    val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    try {
        notificationManager.notify((System.currentTimeMillis() % 100000).toInt(), builder.build())
        Toast.makeText(context, "$title\n$content", Toast.LENGTH_LONG).show()
    } catch (e: Exception) {
        // Fallback to Toast if notification fails or throws permissions security error
        Toast.makeText(context, "$title\n$content", Toast.LENGTH_LONG).show()
    }
}

enum class HenaTab {
    SOT, KALENDARI, DITARI, KESHILLA
}

@Composable
fun HenaApp() {
    val context = LocalContext.current
    val viewModel: HenaViewModel = viewModel(factory = HenaViewModel.Factory(context))

    val isPinEnabled by viewModel.isPinEnabled.collectAsStateWithLifecycle()
    val isUnlocked by viewModel.isUnlocked.collectAsStateWithLifecycle()

    var currentTab by remember { mutableStateOf(HenaTab.SOT) }
    var showSettingsDialog by remember { mutableStateOf(false) }

    if (isPinEnabled && !isUnlocked) {
        PinLockScreen(viewModel = viewModel)
    } else {
        Scaffold(
            modifier = Modifier.fillMaxSize(),
            contentWindowInsets = WindowInsets(0, 0, 0, 0),
            bottomBar = {
                HenaBottomNavigation(
                    currentTab = currentTab,
                    onTabSelected = { currentTab = it }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(bottom = innerPadding.calculateBottomPadding())
            ) {
                when (currentTab) {
                    HenaTab.SOT -> SotDashboard(
                        viewModel = viewModel,
                        onOpenSettings = { showSettingsDialog = true }
                    )
                    HenaTab.KALENDARI -> KalendariView(viewModel = viewModel)
                    HenaTab.DITARI -> DitariView(viewModel = viewModel)
                    HenaTab.KESHILLA -> KeshillaView()
                }

                if (showSettingsDialog) {
                    SettingsDialog(
                        viewModel = viewModel,
                        onDismiss = { showSettingsDialog = false }
                    )
                }
            }
        }
    }
}

@Composable
fun HenaBottomNavigation(
    currentTab: HenaTab,
    onTabSelected: (HenaTab) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 12.dp, vertical = 8.dp)
            .shadow(
                elevation = 20.dp,
                shape = RoundedCornerShape(28.dp),
                spotColor = CrimsonRose.copy(alpha = 0.25f),
                ambientColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
            )
            .border(
                width = 1.2.dp,
                brush = Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.4f),
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)
                    )
                ),
                shape = RoundedCornerShape(28.dp)
            ),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
        tonalElevation = 12.dp,
        shape = RoundedCornerShape(28.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(vertical = 8.dp, horizontal = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            HenaNavItem(
                icon = Icons.Filled.Home,
                label = "Sot",
                isSelected = currentTab == HenaTab.SOT,
                onClick = { onTabSelected(HenaTab.SOT) },
                testTag = "sot_tab"
            )
            HenaNavItem(
                icon = Icons.Filled.DateRange,
                label = "Kalendari",
                isSelected = currentTab == HenaTab.KALENDARI,
                onClick = { onTabSelected(HenaTab.KALENDARI) },
                testTag = "kalendari_tab"
            )
            HenaNavItem(
                icon = Icons.AutoMirrored.Filled.List,
                label = "Ditari",
                isSelected = currentTab == HenaTab.DITARI,
                onClick = { onTabSelected(HenaTab.DITARI) },
                testTag = "ditari_tab"
            )
            HenaNavItem(
                icon = Icons.Filled.Info,
                label = "Këshilla",
                isSelected = currentTab == HenaTab.KESHILLA,
                onClick = { onTabSelected(HenaTab.KESHILLA) },
                testTag = "keshilla_tab"
            )
        }
    }
}

@Composable
fun RowScope.HenaNavItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    isSelected: Boolean,
    onClick: () -> Unit,
    testTag: String
) {
    val contentColor = if (isSelected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
    }

    val backgroundColor = if (isSelected) {
        MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)
    } else {
        Color.Transparent
    }

    Box(
        modifier = Modifier
            .weight(1f)
            .testTag(testTag)
            .clip(RoundedCornerShape(20.dp))
            .background(backgroundColor)
            .clickable(onClick = onClick)
            .padding(vertical = 8.dp, horizontal = 4.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = contentColor,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = contentColor
            )
        }
    }
}

// --- TAB 1: SOT DASHBOARD ---
@Composable
fun SotDashboard(
    viewModel: HenaViewModel,
    onOpenSettings: () -> Unit
) {
    val username by viewModel.username.collectAsStateWithLifecycle()
    val cycleLengthVal by viewModel.cycleLength.collectAsStateWithLifecycle()

    var selectedDashboardDate by remember { mutableStateOf(LocalDate.now()) }
    val today = LocalDate.now()

    val cycleState = viewModel.getCycleState(selectedDashboardDate)
    val phaseColor = Color(android.graphics.Color.parseColor(cycleState.colorHex))
    val dateFormatted = viewModel.formatToAlbanianDate(selectedDashboardDate)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 20.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Custom 2026 Header with User Glow Avatar & Quick Status Pill
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 16.dp, bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(46.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(phaseColor, phaseColor.copy(alpha = 0.4f))
                            )
                        )
                        .padding(2.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surface),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "🌙",
                        fontSize = 22.sp
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Text(
                        text = "Përshëndetje, $username! ✨",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onBackground
                    )
                    Text(
                        text = if (selectedDashboardDate == today) "Sot • $dateFormatted" else dateFormatted,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.6f)
                    )
                }
            }

            IconButton(
                onClick = onOpenSettings,
                colors = IconButtonDefaults.iconButtonColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.primary
                ),
                modifier = Modifier
                    .size(44.dp)
                    .shadow(4.dp, CircleShape, spotColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f))
                    .border(
                        1.2.dp,
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.25f),
                        CircleShape
                    )
            ) {
                Icon(
                    imageVector = Icons.Filled.Settings,
                    contentDescription = "Cilësimet",
                    modifier = Modifier.size(20.dp)
                )
            }
        }

        // Horizontal Calendar Strip
        val datesList = remember {
            (-4..6).map { today.plusDays(it.toLong()) }
        }

        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(horizontal = 2.dp)
        ) {
            items(datesList) { date ->
                val isSelected = date == selectedDashboardDate
                val isCurrentToday = date == today
                val stateForDate = viewModel.getCycleState(date)
                val stateColor = Color(android.graphics.Color.parseColor(stateForDate.colorHex))
                
                val dayOfWeekStr = when (date.dayOfWeek.value) {
                    1 -> "Hën"
                    2 -> "Mar"
                    3 -> "Mër"
                    4 -> "Enj"
                    5 -> "Pre"
                    6 -> "Sht"
                    7 -> "Die"
                    else -> ""
                }

                Card(
                    modifier = Modifier
                        .width(55.dp)
                        .clickable { selectedDashboardDate = date },
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isSelected) stateColor else if (isCurrentToday) MaterialTheme.colorScheme.primary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surface
                    ),
                    border = BorderStroke(
                        width = if (isSelected) 0.dp else if (isCurrentToday) 1.5.dp else 1.dp,
                        color = if (isCurrentToday) stateColor else MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(vertical = 10.dp, horizontal = 4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = dayOfWeekStr,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = date.dayOfMonth.toString(),
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        // Small colored phase dot
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) Color.White else stateColor)
                        )
                    }
                }
            }
        }

        if (selectedDashboardDate != today) {
            TextButton(
                onClick = { selectedDashboardDate = today },
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                Text(
                    text = "Kthehu te e sotmja 🔄",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }

        Spacer(modifier = Modifier.height(10.dp))

        // Central Circle Card (The 2026 Luminous Moon Ring)
        Box(
            modifier = Modifier
                .size(265.dp)
                .shadow(
                    elevation = 24.dp,
                    shape = CircleShape,
                    spotColor = phaseColor.copy(alpha = 0.5f),
                    ambientColor = phaseColor.copy(alpha = 0.2f)
                )
                .background(
                    Brush.radialGradient(
                        colors = listOf(
                            phaseColor.copy(alpha = 0.22f),
                            phaseColor.copy(alpha = 0.05f),
                            Color.Transparent
                        )
                    )
                )
                .border(
                    width = 1.5.dp,
                    brush = Brush.sweepGradient(
                        colors = listOf(
                            phaseColor,
                            phaseColor.copy(alpha = 0.3f),
                            phaseColor
                        )
                    ),
                    shape = CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                // Interactive Custom Moon Phase Canvas
                IFMoonPhaseCanvas(
                    cycleDay = cycleState.cycleDay,
                    cycleLength = cycleLengthVal,
                    phaseColor = phaseColor
                )

                Spacer(modifier = Modifier.height(14.dp))

                Text(
                    text = if (cycleState.cycleDay > 0) "Dita ${cycleState.cycleDay}" else "S'ka të dhëna",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onBackground
                )
                
                Spacer(modifier = Modifier.height(4.dp))

                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(14.dp))
                        .background(phaseColor.copy(alpha = 0.18f))
                        .border(
                            1.dp,
                            phaseColor.copy(alpha = 0.35f),
                            RoundedCornerShape(14.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = cycleState.phaseName,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = phaseColor
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Display current quick details
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                            phaseColor.copy(alpha = 0.15f)
                        )
                    ),
                    shape = RoundedCornerShape(24.dp)
                ),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp)
            ) {
                Text(
                    text = "Gjendja e Ciklit",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = cycleState.phaseDescription,
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                )

                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    CycleIndicatorItem(
                        title = "Periodat tjetër",
                        value = "Pas ${cycleState.nextPeriodDaysLeft} ditësh",
                        subtitle = "Më ${cycleState.nextPeriodDateFormatted.substringAfter(", ")}",
                        icon = Icons.Filled.DateRange,
                        accentColor = CrimsonRose
                    )
                    CycleIndicatorItem(
                        title = "Dritarja e Ovulimit",
                        value = if (cycleState.isFertile) "Sot: Pjellore" else "Pas ${cycleState.ovulationDayLeft} ditëve",
                        subtitle = if (cycleState.isFertile) "Dritare e lartë" else "Gjurmo ditët",
                        icon = Icons.Filled.Info,
                        accentColor = BlossomGold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Interactive Hydration tracker (Water Tracker Card)
        WaterTrackerCard(
            selectedDate = selectedDashboardDate,
            viewModel = viewModel,
            phaseName = cycleState.phaseName
        )

        Spacer(modifier = Modifier.height(8.dp))

        // Daily Cycle Start and End Dates Logging Component (Albanian)
        CycleLoggingComponent(viewModel = viewModel)

        Spacer(modifier = Modifier.height(16.dp))

        // Period Toggle Action button with 2026 glowing pill shadow
        Button(
            onClick = {
                viewModel.togglePeriodStartToday()
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = CrimsonRose,
                contentColor = Color.White
            ),
            shape = RoundedCornerShape(20.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .shadow(
                    elevation = 12.dp,
                    shape = RoundedCornerShape(20.dp),
                    spotColor = CrimsonRose.copy(alpha = 0.5f),
                    ambientColor = CrimsonRose.copy(alpha = 0.2f)
                )
                .testTag("submit_button"),
            elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
        ) {
            Icon(
                imageVector = Icons.Filled.Add,
                contentDescription = null,
                modifier = Modifier.size(22.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "Filluan periodat sot! 🩸",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(20.dp))
    }
}

@Composable
fun WaterTrackerCard(
    selectedDate: LocalDate,
    viewModel: HenaViewModel,
    phaseName: String
) {
    val allSettings by viewModel.allSettings.collectAsStateWithLifecycle()
    val dateStr = selectedDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
    val waterKey = "water_ml_$dateStr"
    val loggedWater = allSettings[waterKey]?.toIntOrNull() ?: 0
    val targetWater = 2000
    val progress = (loggedWater.toFloat() / targetWater).coerceIn(0f, 1f)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(
                width = 1.dp,
                brush = Brush.horizontalGradient(
                    colors = listOf(
                        AquaHydrate.copy(alpha = 0.3f),
                        MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                    )
                ),
                shape = RoundedCornerShape(24.dp)
            ),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(AquaHydrate.copy(alpha = 0.12f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("💧", fontSize = 18.sp)
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Gjurmuesi i Hidratimit",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(AquaHydrate.copy(alpha = 0.12f))
                        .border(1.dp, AquaHydrate.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = "$loggedWater / $targetWater ml",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = AquaHydrate
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Pini mjaftueshëm ujë sot për të ndihmuar trupin gjatë ${phaseName.lowercase()}.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                lineHeight = 16.sp
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Animated Hydration Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(12.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.12f))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(fraction = progress)
                        .clip(RoundedCornerShape(8.dp))
                        .background(
                            Brush.horizontalGradient(
                                colors = listOf(AquaHydrate, Color(0xFF0088FF))
                            )
                        )
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        val newVal = loggedWater + 250
                        viewModel.updateSetting(waterKey, newVal.toString())
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF3B82F6).copy(alpha = 0.1f),
                        contentColor = Color(0xFF3B82F6)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Text("+250 ml 🥛", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        val newVal = loggedWater + 500
                        viewModel.updateSetting(waterKey, newVal.toString())
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF3B82F6).copy(alpha = 0.1f),
                        contentColor = Color(0xFF3B82F6)
                    ),
                    shape = RoundedCornerShape(10.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Text("+500 ml 🥤", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                if (loggedWater > 0) {
                    IconButton(
                        onClick = {
                            val newVal = (loggedWater - 250).coerceAtLeast(0)
                            viewModel.updateSetting(waterKey, newVal.toString())
                        },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.08f),
                            contentColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        ),
                        modifier = Modifier.size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Hiq",
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CycleLoggingComponent(viewModel: HenaViewModel) {
    val allCyclePeriods by viewModel.allCyclePeriods.collectAsStateWithLifecycle()
    val context = LocalContext.current
    
    // Form Inputs State
    var startDateInput by remember { mutableStateOf(LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var endDateInput by remember { mutableStateOf("") }
    var isOngoing by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf("") }
    var successMessage by remember { mutableStateOf("") }
    
    // Editing state: if editingCycleId is not null, we are editing that cycle ID
    var editingCycleId by remember { mutableStateOf<Int?>(null) }

    // Quick logging state / check
    val activeOngoingCycle = allCyclePeriods.find { it.endDateString == null }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .padding(20.dp)
                .animateContentSize()
        ) {
            // Header with icon and adaptive mode indicator
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.DateRange,
                        contentDescription = null,
                        tint = CrimsonRose,
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = if (editingCycleId != null) "Redaktimi i Ciklit ✍️" else "Regjistrimi i Ciklit 🩸",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }

                // If editing, show editing badge
                if (editingCycleId != null) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "Në redaktim",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = if (editingCycleId != null) {
                    "Përditësoni datat e fillimit dhe mbarimit të ciklit të përzgjedhur."
                } else {
                    "Regjistroni datat e fillimit dhe mbarimit të ciklit tuaj menstrual."
                },
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Quick log helper actions when NOT in editing mode
            if (editingCycleId == null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    if (activeOngoingCycle != null) {
                        // There's an active ongoing cycle, offer a single button to CLOSE it today
                        Button(
                            onClick = {
                                try {
                                    val startLocal = LocalDate.parse(activeOngoingCycle.startDateString)
                                    val today = LocalDate.now()
                                    if (today.isBefore(startLocal)) {
                                        throw IllegalArgumentException("Data e sotme është para datës së fillimit të ciklit.")
                                    }
                                    viewModel.updateCyclePeriod(
                                        id = activeOngoingCycle.id,
                                        startDate = startLocal,
                                        endDate = today
                                    )
                                    successMessage = "Cikli u mbyll me sukses sot! 🏁"
                                    errorMessage = ""
                                } catch (e: Exception) {
                                    errorMessage = e.message ?: "Gabim gjatë mbylljes së ciklit."
                                    successMessage = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CrimsonRose.copy(alpha = 0.1f),
                                contentColor = CrimsonRose
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text(
                                text = "Mbyll ciklin sot 🏁",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    } else {
                        // No active ongoing cycle, offer a single button to START one today
                        Button(
                            onClick = {
                                try {
                                    val today = LocalDate.now()
                                    viewModel.saveCyclePeriod(today, null)
                                    successMessage = "U regjistrua një cikël i ri sot! 🩸"
                                    errorMessage = ""
                                } catch (e: Exception) {
                                    errorMessage = e.message ?: "Gabim gjatë fillimit të ciklit."
                                    successMessage = ""
                                }
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CrimsonRose.copy(alpha = 0.1f),
                                contentColor = CrimsonRose
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f),
                            contentPadding = PaddingValues(vertical = 10.dp)
                        ) {
                            Text(
                                text = "Më filloi cikli sot 🩸",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }

            // Start Date Input
            Text(
                text = "Data e fillimit (VVVV-MM-DD)",
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = startDateInput,
                    onValueChange = { 
                        startDateInput = it 
                        errorMessage = ""
                        successMessage = ""
                    },
                    placeholder = { Text("Shembull: 2026-06-14") },
                    modifier = Modifier.weight(1f),
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = {
                        IconButton(onClick = {
                            val initialDate = try { LocalDate.parse(startDateInput.trim()) } catch (e: Exception) { LocalDate.now() }
                            android.app.DatePickerDialog(
                                context,
                                { _, year, month, dayOfMonth ->
                                    startDateInput = LocalDate.of(year, month + 1, dayOfMonth).format(DateTimeFormatter.ISO_LOCAL_DATE)
                                    errorMessage = ""
                                    successMessage = ""
                                },
                                initialDate.year,
                                initialDate.monthValue - 1,
                                initialDate.dayOfMonth
                            ).show()
                        }) {
                            Icon(
                                imageVector = Icons.Filled.DateRange,
                                contentDescription = "Zgjidh datën",
                                tint = CrimsonRose
                            )
                        }
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = CrimsonRose,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    )
                )
                Button(
                    onClick = { 
                        startDateInput = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) 
                        errorMessage = ""
                        successMessage = ""
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                        contentColor = MaterialTheme.colorScheme.primary
                    ),
                    shape = RoundedCornerShape(12.dp),
                    contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text("Sot", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Is Ongoing Checkbox
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { 
                        isOngoing = !isOngoing 
                        if (isOngoing) endDateInput = ""
                        errorMessage = ""
                        successMessage = ""
                    }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Checkbox(
                    checked = isOngoing,
                    onCheckedChange = { 
                        isOngoing = it 
                        if (isOngoing) endDateInput = ""
                        errorMessage = ""
                        successMessage = ""
                    },
                    colors = CheckboxDefaults.colors(checkedColor = CrimsonRose)
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "Cikli është ende në vazhdim (aktiv)",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            // End Date Input (only shown if not ongoing, with smooth AnimatedVisibility transition)
            AnimatedVisibility(visible = !isOngoing) {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Data e mbarimit (VVVV-MM-DD)",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = endDateInput,
                            onValueChange = { 
                                endDateInput = it 
                                errorMessage = ""
                                successMessage = ""
                            },
                            placeholder = { Text("Shembull: 2026-06-19") },
                            modifier = Modifier.weight(1f),
                            textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp),
                            trailingIcon = {
                                IconButton(onClick = {
                                    val initialDate = try { 
                                        if (endDateInput.trim().isNotEmpty()) LocalDate.parse(endDateInput.trim()) else LocalDate.now()
                                    } catch (e: Exception) { 
                                        LocalDate.now() 
                                    }
                                    android.app.DatePickerDialog(
                                        context,
                                        { _, year, month, dayOfMonth ->
                                            endDateInput = LocalDate.of(year, month + 1, dayOfMonth).format(DateTimeFormatter.ISO_LOCAL_DATE)
                                            errorMessage = ""
                                            successMessage = ""
                                        },
                                        initialDate.year,
                                        initialDate.monthValue - 1,
                                        initialDate.dayOfMonth
                                    ).show()
                                }) {
                                    Icon(
                                        imageVector = Icons.Filled.DateRange,
                                        contentDescription = "Zgjidh datën",
                                        tint = CrimsonRose
                                    )
                                }
                            },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = CrimsonRose,
                                unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                            )
                        )
                        Button(
                            onClick = { 
                                endDateInput = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE) 
                                errorMessage = ""
                                successMessage = ""
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                contentColor = MaterialTheme.colorScheme.primary
                            ),
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 14.dp, vertical = 8.dp)
                        ) {
                            Text("Sot", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Real-time calculation feedback
            val calculatedDays = remember(startDateInput, endDateInput, isOngoing) {
                try {
                    val s = LocalDate.parse(startDateInput.trim())
                    val e = if (isOngoing || endDateInput.trim().isEmpty()) null else LocalDate.parse(endDateInput.trim())
                    if (s != null && e != null) {
                        ChronoUnit.DAYS.between(s, e) + 1
                    } else null
                } catch (ex: Exception) {
                    null
                }
            }

            if (calculatedDays != null && calculatedDays > 0) {
                Spacer(modifier = Modifier.height(12.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(CrimsonRose.copy(alpha = 0.08f))
                        .padding(horizontal = 12.dp, vertical = 8.dp)
                ) {
                    Text(
                        text = "ℹ️ Kohëzgjatja e parashikuar e ciklit: $calculatedDays ditë.",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = CrimsonRose
                    )
                }
            }

            // Error or Success Messages
            if (errorMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = errorMessage,
                    color = MaterialTheme.colorScheme.error,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            if (successMessage.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = successMessage,
                    color = Color(0xFF10B981), // Emerald Green
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Form Action Buttons Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // If editing, show dynamic Cancel button
                if (editingCycleId != null) {
                    OutlinedButton(
                        onClick = {
                            // Reset editing mode
                            editingCycleId = null
                            startDateInput = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
                            endDateInput = ""
                            isOngoing = true
                            errorMessage = ""
                            successMessage = ""
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        ),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                    ) {
                        Text(
                            text = "Anulo ✖",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                // Main Save/Update button
                Button(
                    onClick = {
                        try {
                            val parsedStart = LocalDate.parse(startDateInput.trim())
                            val parsedEnd = if (isOngoing) null else {
                                if (endDateInput.trim().isEmpty()) {
                                    throw IllegalArgumentException("Ju lutem plotësoni datën e mbarimit ose zgjidhni 'në vazhdim'.")
                                }
                                LocalDate.parse(endDateInput.trim())
                            }
                            
                            if (parsedEnd != null && parsedEnd.isBefore(parsedStart)) {
                                throw IllegalArgumentException("Data e mbarimit nuk mund të jetë para datës së fillimit.")
                            }

                            val currentEditingId = editingCycleId
                            if (currentEditingId != null) {
                                // Update existing
                                viewModel.updateCyclePeriod(currentEditingId, parsedStart, parsedEnd)
                                successMessage = "Cikli u përditësua me sukses! 💾"
                                editingCycleId = null
                            } else {
                                // Insert new
                                viewModel.saveCyclePeriod(parsedStart, parsedEnd)
                                successMessage = "Cikli u regjistrua me sukses! 🎉"
                            }
                            
                            errorMessage = ""
                            // Reset inputs
                            if (!isOngoing) {
                                endDateInput = ""
                                isOngoing = true
                            }
                        } catch (e: java.time.format.DateTimeParseException) {
                            errorMessage = "Format i pasaktë. Përdorni formatin VVVV-MM-DD (shembull: 2026-06-14)."
                            successMessage = ""
                        } catch (e: IllegalArgumentException) {
                            errorMessage = e.message ?: "Gabim."
                            successMessage = ""
                        }
                    },
                    modifier = Modifier
                        .weight(if (editingCycleId != null) 1.5f else 1f)
                        .height(48.dp)
                        .testTag("save_cycle_button"),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = CrimsonRose,
                        contentColor = Color.White
                    ),
                    shape = RoundedCornerShape(12.dp),
                    elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
                ) {
                    Text(
                        text = if (editingCycleId != null) "Përditëso Ciklin 💾" else "Regjistro Ciklin",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            // Divider and history list
            Spacer(modifier = Modifier.height(20.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(1.dp)
                    .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
            )
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Historiku i Cikleve 📅",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Spacer(modifier = Modifier.height(8.dp))

            if (allCyclePeriods.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "S'ka cikle të regjistruara ende në histori.",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                        textAlign = TextAlign.Center
                    )
                }
            } else {
                Column(
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    allCyclePeriods.take(5).forEach { cycle ->
                        val startLocal = try { LocalDate.parse(cycle.startDateString) } catch(e: Exception) { null }
                        val endLocal = if (cycle.endDateString != null) {
                            try { LocalDate.parse(cycle.endDateString) } catch(e: Exception) { null }
                        } else null

                        val formattedStart = if (startLocal != null) {
                            viewModel.formatToAlbanianDate(startLocal).substringAfter(", ")
                        } else cycle.startDateString

                        val formattedEnd = if (cycle.endDateString == null) {
                            "Në vazhdim"
                        } else if (endLocal != null) {
                            viewModel.formatToAlbanianDate(endLocal).substringAfter(", ")
                        } else cycle.endDateString

                        val durationText = if (startLocal != null && endLocal != null) {
                            val days = ChronoUnit.DAYS.between(startLocal, endLocal) + 1
                            "$days ditë"
                        } else "Aktiv"

                        val isCurrentEditing = editingCycleId == cycle.id

                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(12.dp))
                                .background(
                                    if (isCurrentEditing) CrimsonRose.copy(alpha = 0.08f)
                                    else MaterialTheme.colorScheme.background.copy(alpha = 0.5f)
                                )
                                .border(
                                    width = if (isCurrentEditing) 1.5.dp else 0.dp,
                                    color = if (isCurrentEditing) CrimsonRose else Color.Transparent,
                                    shape = RoundedCornerShape(12.dp)
                                )
                                .clickable {
                                    // Clicking row loads cycle into state for editing
                                    editingCycleId = cycle.id
                                    startDateInput = cycle.startDateString
                                    endDateInput = cycle.endDateString ?: ""
                                    isOngoing = (cycle.endDateString == null)
                                    errorMessage = ""
                                    successMessage = "Zgjedhur për redaktim: $formattedStart ➔ $formattedEnd ✍️"
                                }
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(6.dp)
                                            .clip(CircleShape)
                                            .background(if (cycle.endDateString == null) Color(0xFF10B981) else CrimsonRose)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "$formattedStart  ➔  $formattedEnd",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = if (cycle.endDateString == null) "Cikli po vazhdon tani" else "Kohëzgjatja: $durationText",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }

                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(2.dp)
                            ) {
                                // Edit icon/button
                                IconButton(
                                    onClick = {
                                        editingCycleId = cycle.id
                                        startDateInput = cycle.startDateString
                                        endDateInput = cycle.endDateString ?: ""
                                        isOngoing = (cycle.endDateString == null)
                                        errorMessage = ""
                                        successMessage = "Zgjedhur për redaktim: $formattedStart ➔ $formattedEnd ✍️"
                                    },
                                    modifier = Modifier.size(32.dp),
                                    colors = IconButtonDefaults.iconButtonColors(
                                        contentColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.8f)
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Edit,
                                        contentDescription = "Redakto ciklin",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }

                                // Delete icon/button
                                IconButton(
                                    onClick = { 
                                        if (editingCycleId == cycle.id) {
                                            editingCycleId = null
                                            startDateInput = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE)
                                            endDateInput = ""
                                            isOngoing = true
                                        }
                                        viewModel.deleteCyclePeriod(cycle.id) 
                                    },
                                    modifier = Modifier.size(32.dp),
                                    colors = IconButtonDefaults.iconButtonColors(
                                        contentColor = MaterialTheme.colorScheme.error.copy(alpha = 0.7f)
                                    )
                                ) {
                                    Icon(
                                        imageVector = Icons.Filled.Delete,
                                        contentDescription = "Fshij ciklin",
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }
                    if (allCyclePeriods.size > 5) {
                        Text(
                            text = "+ edhe ${allCyclePeriods.size - 5} cikle të tjera në historik",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(top = 4.dp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun CycleIndicatorItem(
    title: String,
    value: String,
    subtitle: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    accentColor: Color
) {
    Row(
        modifier = Modifier
            .width(150.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.5f))
            .padding(10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = accentColor,
            modifier = Modifier.size(20.dp)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Column {
            Text(
                text = title,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
            )
            Text(
                text = value,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 10.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
fun IFMoonPhaseCanvas(
    cycleDay: Int,
    cycleLength: Int,
    phaseColor: Color
) {
    val bgCol = MaterialTheme.colorScheme.background
    val surfVarCol = MaterialTheme.colorScheme.surfaceVariant
    val outlineCol = MaterialTheme.colorScheme.outline

    Canvas(modifier = Modifier.size(130.dp)) {
        val radius = size.minDimension * 0.35f
        val center = Offset(size.width / 2f, size.height / 2f)

        // 1. Draw outer thin orbital ring representing the entire cycle progress
        val orbitRadius = radius + 22f
        drawCircle(
            color = outlineCol.copy(alpha = 0.2f),
            radius = orbitRadius,
            center = center,
            style = Stroke(width = 2.5f)
        )

        // 2. Draw active cycle progress sweep arc
        val sweepAngle = if (cycleLength > 0 && cycleDay > 0) {
            (cycleDay.toFloat() / cycleLength).coerceIn(0f, 1f) * 360f
        } else 0f

        drawArc(
            color = phaseColor.copy(alpha = 0.8f),
            startAngle = -90f,
            sweepAngle = sweepAngle,
            useCenter = false,
            style = Stroke(
                width = 5f,
                cap = StrokeCap.Round
            ),
            topLeft = Offset(center.x - orbitRadius, center.y - orbitRadius),
            size = androidx.compose.ui.geometry.Size(orbitRadius * 2, orbitRadius * 2)
        )

        // 3. Draw soft backglow of the moon sphere
        drawCircle(
            color = phaseColor.copy(alpha = 0.15f),
            radius = radius + 8f,
            center = center
        )

        // 4. Draw backing moon sphere (the shadow part)
        drawCircle(
            color = surfVarCol,
            radius = radius,
            center = center,
            style = Fill
        )

        // 5. Calculate illuminated side based on cycle day
        val halfCycle = cycleLength / 2f
        val fraction = if (cycleDay <= halfCycle) {
            cycleDay / halfCycle
        } else {
            (cycleLength - cycleDay) / halfCycle
        }

        if (cycleDay in (halfCycle - 2).toInt()..(halfCycle + 2).toInt()) {
            // Full Moon / Ovulation - draw full glowing yellow circle
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(phaseColor, phaseColor.copy(alpha = 0.5f)),
                    center = center,
                    radius = radius
                ),
                radius = radius,
                center = center
            )
        } else {
            // Draw lit area
            drawCircle(
                color = phaseColor,
                radius = radius,
                center = center
            )

            // Overlap shadow matching current theme background
            val shadowOffset = if (cycleDay <= halfCycle) {
                radius * (1.1f - fraction * 1.5f)
            } else {
                -radius * (1.1f - fraction * 1.5f)
            }

            drawCircle(
                color = bgCol,
                radius = radius * 0.98f,
                center = Offset(center.x + shadowOffset, center.y)
            )
        }

        // 6. Draw craters
        val craterPaintColor = Color.White.copy(alpha = 0.08f)
        drawCircle(
            color = craterPaintColor,
            radius = radius * 0.2f,
            center = Offset(center.x - radius * 0.3f, center.y - radius * 0.2f)
        )
        drawCircle(
            color = craterPaintColor,
            radius = radius * 0.12f,
            center = Offset(center.x + radius * 0.4f, center.y + radius * 0.3f)
        )
        drawCircle(
            color = craterPaintColor,
            radius = radius * 0.08f,
            center = Offset(center.x - radius * 0.1f, center.y + radius * 0.5f)
        )
    }
}


// --- TAB 2: KALENDARI VIEW ---
@Composable
fun KalendariView(viewModel: HenaViewModel) {
    val selectedDate by viewModel.selectedDate.collectAsStateWithLifecycle()
    val allPeriodDays by viewModel.allPeriodDays.collectAsStateWithLifecycle()
    val cycleLengthVal by viewModel.cycleLength.collectAsStateWithLifecycle()
    val periodLengthVal by viewModel.periodLength.collectAsStateWithLifecycle()
    val lastPeriodStartStr by viewModel.lastPeriodStart.collectAsStateWithLifecycle()

    var showLogDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Kalendari i Ciklit",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Month Selector Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Month Selector Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { viewModel.navigateMonth(-1) }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                            contentDescription = "Muaji i kaluar"
                        )
                    }
                    Text(
                        text = viewModel.getMonthYearAlbanian(selectedDate),
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = { viewModel.navigateMonth(1) }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                            contentDescription = "Muaji tjetër"
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Days of Week labels (Albanian)
                Row(modifier = Modifier.fillMaxWidth()) {
                    val daysHeader = listOf("H", "M", "M", "E", "P", "S", "D")
                    daysHeader.forEach { dayLetter ->
                        Text(
                            text = dayLetter,
                            modifier = Modifier.weight(1f),
                            textAlign = TextAlign.Center,
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Calendar Grid calculation
                val firstDayOfMonth = selectedDate.withDayOfMonth(1)
                val daysInMonth = selectedDate.lengthOfMonth()
                
                // DayOfWeek value: 1 = Monday, 7 = Sunday
                val firstDayOfWeekIndex = firstDayOfMonth.dayOfWeek.value
                val leadingEmptyCells = firstDayOfWeekIndex - 1

                val totalCells = leadingEmptyCells + daysInMonth
                val rowsCount = (totalCells + 6) / 7

                for (r in 0 until rowsCount) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        for (c in 0..6) {
                            val cellIndex = r * 7 + c
                            val dayNumber = cellIndex - leadingEmptyCells + 1

                            if (cellIndex < leadingEmptyCells || dayNumber > daysInMonth) {
                                // Empty placeholder cell
                                Spacer(modifier = Modifier.weight(1f))
                            } else {
                                val cellDate = selectedDate.withDayOfMonth(dayNumber)
                                val cellDateStr = cellDate.format(DateTimeFormatter.ISO_LOCAL_DATE)

                                // Determine logs & predictions
                                val loggedDay = allPeriodDays.firstOrNull { it.dateString == cellDateStr }
                                val hasLoggedBleeding = loggedDay != null && loggedDay.flow > 0

                                // Cycle prediction logic inside cell
                                var isPredictedPeriod = false
                                var isPredictedFertile = false

                                if (lastPeriodStartStr.isNotEmpty()) {
                                    val lastStart = LocalDate.parse(lastPeriodStartStr)
                                    val daysDiff = ChronoUnit.DAYS.between(lastStart, cellDate)
                                    if (daysDiff >= 0) {
                                        val cDay = ((daysDiff % cycleLengthVal).toInt()) + 1
                                        val ovulationDay = cycleLengthVal - 14
                                        if (cDay in 1..periodLengthVal) {
                                            isPredictedPeriod = true
                                        } else if (cDay in (ovulationDay - 3)..(ovulationDay + 1)) {
                                            isPredictedFertile = true
                                        }
                                    }
                                }

                                val isToday = cellDate.isEqual(LocalDate.now())
                                val isSelected = cellDate.isEqual(selectedDate)

                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .aspectRatio(1f)
                                        .padding(2.dp)
                                        .clip(CircleShape)
                                        .background(
                                            when {
                                                isSelected -> MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)
                                                hasLoggedBleeding -> CrimsonRose.copy(alpha = 0.2f)
                                                isPredictedPeriod -> CrimsonRose.copy(alpha = 0.1f)
                                                isPredictedFertile -> BlossomGold.copy(alpha = 0.12f)
                                                isToday -> MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f)
                                                else -> Color.Transparent
                                            }
                                        )
                                        .border(
                                            1.dp,
                                            if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent,
                                            CircleShape
                                        )
                                        .clickable {
                                            viewModel.selectDate(cellDate)
                                        },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Text(
                                            text = dayNumber.toString(),
                                            fontSize = 14.sp,
                                            fontWeight = if (isSelected || isToday) FontWeight.Bold else FontWeight.Normal,
                                            color = when {
                                                hasLoggedBleeding -> CrimsonRose
                                                isPredictedPeriod -> CrimsonRose.copy(alpha = 0.8f)
                                                isPredictedFertile -> BlossomGold
                                                else -> MaterialTheme.colorScheme.onSurface
                                            }
                                        )

                                        // Indicators row below day number
                                        Row(
                                            horizontalArrangement = Arrangement.Center,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            if (loggedDay != null && loggedDay.symptoms.isNotEmpty()) {
                                                Box(
                                                    modifier = Modifier
                                                        .size(4.dp)
                                                        .clip(CircleShape)
                                                        .background(TwilightPurple)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Selected Date Log Details card
        val selectedDayLog by viewModel.selectedPeriodDay.collectAsStateWithLifecycle()
        val formattedSelectedDate = viewModel.formatToAlbanianDate(selectedDate)

        Card(
            modifier = Modifier.fillMaxWidth().animateContentSize(),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = formattedSelectedDate,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = if (selectedDate.isEqual(LocalDate.now())) "Dita e zgjedhur: Sot" else "Detajet e ditës",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    }

                    Button(
                        onClick = { showLogDialog = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
                            contentColor = MaterialTheme.colorScheme.primary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Edit,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = if (selectedDayLog == null) "Regjistro" else "Ndrysho",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                if (selectedDayLog == null) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 12.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "Nuk keni regjistruar simptoma ose fluks për këtë ditë. Klikoni 'Regjistro' më lart.",
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                            modifier = Modifier.padding(horizontal = 16.dp)
                        )
                    }
                } else {
                    val log = selectedDayLog!!

                    // Flow Intensity Info
                    if (log.flow > 0) {
                        val flowName = listOf("Mungon", "Lehtë", "Mesatare", "Shumë")[log.flow]
                        DetailBadgeRow(
                            label = "Fluksi menstrual",
                            value = flowName,
                            color = CrimsonRose
                        )
                    }

                    // Pain levels
                    if (log.pain > 0) {
                        val painName = listOf("S'kam", "Lehtë", "Mesatare", "Mjaftueshëm Fortë")[log.pain]
                        DetailBadgeRow(
                            label = "Dhimbja",
                            value = painName,
                            color = TwilightPurple
                        )
                    }

                    // Mood
                    if (log.mood.isNotEmpty()) {
                        DetailBadgeRow(
                            label = "Humori",
                            value = log.mood,
                            color = BlossomGold
                        )
                    }

                    // Symptoms
                    if (log.symptoms.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Simptomat e regjistruara:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(4.dp))

                        @OptIn(ExperimentalLayoutApi::class)
                        FlowRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.Start
                        ) {
                            log.symptoms.split(",").forEach { s ->
                                Box(
                                    modifier = Modifier
                                        .padding(end = 4.dp, bottom = 4.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f))
                                        .padding(horizontal = 8.dp, vertical = 4.dp)
                                ) {
                                    Text(text = s, fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }

                    // Notes
                    if (log.notes.trim().isNotEmpty()) {
                        Spacer(modifier = Modifier.height(10.dp))
                        Text(
                            text = "Shënime personale:",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = log.notes,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    // Delete Button
                    IconButton(
                        onClick = {
                            viewModel.deleteLog(log.dateString)
                        },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.error.copy(alpha = 0.1f),
                            contentColor = MaterialTheme.colorScheme.error
                        ),
                        modifier = Modifier.align(Alignment.End).size(36.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Delete,
                            contentDescription = "Fshij këtë log",
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        if (showLogDialog) {
            SymptomLogDialog(
                viewModel = viewModel,
                logDate = selectedDate,
                existingLog = selectedDayLog,
                onDismiss = { showLogDialog = false }
            )
        }
    }
}

@Composable
fun DetailBadgeRow(label: String, value: String, color: Color) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )
        Box(
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .background(color.copy(alpha = 0.15f))
                .padding(horizontal = 10.dp, vertical = 4.dp)
        ) {
            Text(
                text = value,
                fontSize = 12.sp,
                fontWeight = FontWeight.Bold,
                color = color
            )
        }
    }
}

// --- TAB 3: DITARI (LOGS VIEW) ---
enum class DitariSubTab {
    LISTA, STATISTIKAT
}

@Composable
fun DitariView(viewModel: HenaViewModel) {
    val allPeriodDays by viewModel.allPeriodDays.collectAsStateWithLifecycle()
    var activeSubTab by remember { mutableStateOf(DitariSubTab.LISTA) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 16.dp)
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Ditari im i Shenjave",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = "Histori e të gjitha shënimeve dhe simptomave të regjistruara.",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Switch Tabs Between Checklist and Statistics
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                .padding(4.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (activeSubTab == DitariSubTab.LISTA) CrimsonRose else Color.Transparent)
                    .clickable { activeSubTab = DitariSubTab.LISTA }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Regjistrimet",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = if (activeSubTab == DitariSubTab.LISTA) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(if (activeSubTab == DitariSubTab.STATISTIKAT) CrimsonRose else Color.Transparent)
                    .clickable { activeSubTab = DitariSubTab.STATISTIKAT }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "Statistikat inteligjente",
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    color = if (activeSubTab == DitariSubTab.STATISTIKAT) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                )
            }
        }

        Spacer(modifier = Modifier.height(14.dp))

        if (activeSubTab == DitariSubTab.LISTA) {
            if (allPeriodDays.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 60.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.List,
                            contentDescription = null,
                            modifier = Modifier.size(60.dp),
                            tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.2f)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = "Ditari është bosh",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                        )
                        Text(
                            text = "Shkoni te kalendari për të zgjedhur një dritare dhe shtuar shënime apo simptoma.",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.padding(horizontal = 24.dp).padding(top = 4.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(bottom = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(allPeriodDays, key = { it.dateString }) { log ->
                        val parsedDate = LocalDate.parse(log.dateString)
                        val formattedDate = viewModel.formatToAlbanianDate(parsedDate)

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(16.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = formattedDate,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )

                                    IconButton(
                                        onClick = { viewModel.deleteLog(log.dateString) },
                                        modifier = Modifier.size(28.dp),
                                        colors = IconButtonDefaults.iconButtonColors(
                                            contentColor = MaterialTheme.colorScheme.error.copy(alpha = 0.7f)
                                        )
                                    ) {
                                        Icon(
                                            imageVector = Icons.Filled.Delete,
                                            contentDescription = "Fshij",
                                            modifier = Modifier.size(16.dp)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.height(8.dp))

                                // Flow & Pain Badges Row
                                Row(
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    if (log.flow > 0) {
                                        val flowLabel = listOf("S'ka", "Fluks i Lehtë", "Fluks Mesatar", "Fluks i Plotë")[log.flow]
                                        MiniTag(text = "🩸 $flowLabel", color = CrimsonRose)
                                    }
                                    if (log.pain > 0) {
                                        val painLabel = listOf("S'ka", "Dhimbje e lehtë", "Dhimbje mesatare", "Dhimbje e fortë")[log.pain]
                                        MiniTag(text = "⚡ $painLabel", color = TwilightPurple)
                                    }
                                    if (log.mood.isNotEmpty()) {
                                        MiniTag(text = log.mood, color = BlossomGold)
                                    }
                                }

                                if (log.symptoms.isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Row(
                                        modifier = Modifier.fillMaxWidth()
                                    ) {
                                        Text(
                                            text = "Simptomat: ",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                        )
                                        Text(
                                            text = log.symptoms.split(",").joinToString(", "),
                                            fontSize = 11.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                                        )
                                    }
                                }

                                if (log.notes.trim().isNotEmpty()) {
                                    Spacer(modifier = Modifier.height(6.dp))
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(MaterialTheme.colorScheme.background.copy(alpha = 0.4f))
                                            .padding(8.dp)
                                    ) {
                                        Text(
                                            text = log.notes,
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            HenaStatisticsSection(allPeriodDays = allPeriodDays, viewModel = viewModel)
        }
    }
}

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
fun HenaStatisticsSection(allPeriodDays: List<PeriodDay>, viewModel: HenaViewModel) {
    if (allPeriodDays.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = 60.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Filled.Info,
                    contentDescription = null,
                    modifier = Modifier.size(60.dp),
                    tint = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.2f)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Asnjë datë e regjistruar",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
                )
                Text(
                    text = "Regjistroni simptoma dhe fluks menstrual në ditar për të parë statistikat inteligjente.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.4f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 24.dp).padding(top = 4.dp)
                )
            }
        }
    } else {
        // Compute stats
        val totalDays = allPeriodDays.size
        val bleedingDays = allPeriodDays.count { it.flow > 0 }
        
        val validPainDays = allPeriodDays.count { it.pain > 0 }
        val sumPain = allPeriodDays.sumOf { it.pain }
        val avgPainStr = if (totalDays > 0) String.format("%.1f", sumPain.toDouble() / totalDays) else "0.0"

        // Symptoms distribution
        val symptomCounts = remember(allPeriodDays) {
            val counts = mutableMapOf<String, Int>()
            allPeriodDays.forEach { day ->
                if (day.symptoms.isNotEmpty()) {
                    day.symptoms.split(",").forEach { s ->
                        val cleanSym = s.trim()
                        if (cleanSym.isNotEmpty()) {
                            counts[cleanSym] = (counts[cleanSym] ?: 0) + 1
                        }
                    }
                }
            }
            counts.entries.sortedByDescending { it.value }.take(4)
        }

        // Moods distribution
        val moodCounts = remember(allPeriodDays) {
            val counts = mutableMapOf<String, Int>()
            allPeriodDays.forEach { day ->
                if (day.mood.isNotEmpty()) {
                    counts[day.mood] = (counts[day.mood] ?: 0) + 1
                }
            }
            counts.entries.sortedByDescending { it.value }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Cards Indicators Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Ditë të Shënuara", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$totalDays d", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = CrimsonRose)
                    }
                }
                Card(
                    modifier = Modifier.weight(1.2f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Fluks i Regjistruar", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$bleedingDays ditë", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = CrimsonRose)
                    }
                }
                Card(
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text("Dhimbje Mesatare", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(4.dp))
                        Text("$avgPainStr/3", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = TwilightPurple)
                    }
                }
            }

            // Custom Flow & Pain visualizer (Line Chart Canvas)
            val lastSevenDays = remember(allPeriodDays) {
                allPeriodDays.take(7).reversed()
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Ecuria e Ciklit (Fluksi vs Dhimbja)",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "Të dhënat konfigurohen për 7 ditët e fundit të regjistruara.",
                        fontSize = 10.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .padding(end = 8.dp)
                    ) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val count = lastSevenDays.size
                            val widthStep = if (count > 1) size.width / (count - 1) else size.width
                            val heightScale = size.height / 3.0f

                            // Draw horizontal guidelines
                            for (gridIdx in 0..3) {
                                val gridY = size.height - (gridIdx * heightScale)
                                drawLine(
                                    color = Color.LightGray.copy(alpha = 0.2f),
                                    start = Offset(0f, gridY),
                                    end = Offset(size.width, gridY),
                                    strokeWidth = 1.5f
                                )
                            }

                            if (count > 0) {
                                val flowPoints = lastSevenDays.mapIndexed { idx, day ->
                                    Offset(idx * widthStep, size.height - (day.flow * heightScale))
                                }
                                val painPoints = lastSevenDays.mapIndexed { idx, day ->
                                    Offset(idx * widthStep, size.height - (day.pain * heightScale))
                                }

                                // Connect line paths
                                if (count > 1) {
                                    for (i in 0 until count - 1) {
                                        drawLine(
                                            color = CrimsonRose,
                                            start = flowPoints[i],
                                            end = flowPoints[i+1],
                                            strokeWidth = 5f
                                        )
                                        drawLine(
                                            color = TwilightPurple,
                                            start = painPoints[i],
                                            end = painPoints[i+1],
                                            strokeWidth = 5f
                                        )
                                    }
                                }

                                // Draw circular anchors
                                flowPoints.forEach { pt ->
                                    drawCircle(color = CrimsonRose, radius = 7f, center = pt)
                                    drawCircle(color = Color.White, radius = 3.5f, center = pt)
                                }
                                painPoints.forEach { pt ->
                                    drawCircle(color = TwilightPurple, radius = 7f, center = pt)
                                    drawCircle(color = Color.White, radius = 3.5f, center = pt)
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // Chart Legends
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(CrimsonRose))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Fluksi i Periodave", fontSize = 10.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
                        
                        Spacer(modifier = Modifier.width(20.dp))
                        
                        Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(TwilightPurple))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Niveli i Dhimbjes", fontSize = 10.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
                    }
                }
            }

            // Top Symptoms Panel
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Simptomat më të Shpeshta 🩸",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (symptomCounts.isEmpty()) {
                        Text(
                            text = "Nuk ka ende simptoma të përsëritura të regjistruara.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    } else {
                        symptomCounts.forEach { entry ->
                            val percent = (entry.value.toFloat() / totalDays * 100).toInt()
                            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(entry.key, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.onSurface)
                                    Text("$percent% (${entry.value} d)", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary)
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                // Linear progress bar
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(8.dp)
                                        .clip(RoundedCornerShape(4.dp))
                                        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxHeight()
                                            .fillMaxWidth(fraction = entry.value.toFloat() / totalDays)
                                            .clip(RoundedCornerShape(4.dp))
                                            .background(TwilightPurple)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Mood Distribution Panel
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Harta e Humoreve 🌸",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    if (moodCounts.isEmpty()) {
                        Text(
                            text = "Nuk ka ende humore të regjistruara.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                        )
                    } else {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            moodCounts.forEach { entry ->
                                val moodPct = (entry.value.toFloat() / totalDays * 100).toInt()
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(BlossomGold.copy(alpha = 0.12f))
                                        .border(1.dp, BlossomGold.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(entry.key, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text("$moodPct%", fontSize = 11.sp, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                                    }
                                }
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }
    }
}

@Composable
fun MiniTag(text: String, color: Color) {
    Box(
        modifier = Modifier
            .padding(end = 4.dp, bottom = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(color.copy(alpha = 0.12f))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
    }
}

// --- TAB 4: KESHILLA (HEALTH INSIGHTS VIEW) ---
@Composable
fun KeshillaView() {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(horizontal = 16.dp)
            .verticalScroll(scrollState)
    ) {
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Edukimi dhe Këshillimi",
            fontSize = 20.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = "Njiheni më mirë trupin tuaj me këshilla të bazuara në shkencë.",
            fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.5f)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Phase 1 Card
        InsightPhaseCard(
            title = "1. Faza Menstruale (Dita 1-5)",
            description = "Hormonet janë në nivelet më të ulëta. Kjo është koha kur mitra pastrohet. Mund të ndiheni të lodhura ose me dhimbje barku.",
            tips = listOf(
                "Pini çaj kamomili, xhinxheri dhe pelini të ngrohtë.",
                "Zgjidhni ecje të lehta në vend të ushtrimeve intensive.",
                "Përdorni ujë të ngrohtë me shishe silikoni për lehtësimin e krampeve."
            ),
            themeColor = CrimsonRose
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Phase 2 Card
        InsightPhaseCard(
            title = "2. Faza Folikulare (Dita 6-13)",
            description = "Estrogjeni fillon të rritet. Kjo rrit nivelet e energjisë, rregullon kolagjenin në lëkurë dhe bën që të ndiheni më optimiste.",
            tips = listOf(
                "Kjo është periudha e artë për stërvitje të forta dhe kreativitet.",
                "Filloni projekte të reja ose organizoni daljet shoqërore.",
                "Shtoni perime të freskëta dhe proteina në dietën tuaj."
            ),
            themeColor = TwilightPurple
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Phase 3 Card
        InsightPhaseCard(
            title = "3. Faza Ovuluese (Dita 14-16)",
            description = "Vezorja çliron vezën e pjekur. Estrogjeni dhe hormoni lutenizues arrijnë kulmin. Ditët tuaja më pjellore dhe me besim të plotë.",
            tips = listOf(
                "Rrezatoni tërheqje dhe energji komunikuese të paparë.",
                "Periudhë mjaft e mirë për takime publike apo prezantime.",
                "Konsumoni ushqime të pasura me fibra për të ndihmuar estrogjenin."
            ),
            themeColor = BlossomGold
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Phase 4 Card
        InsightPhaseCard(
            title = "4. Faza Luteale (Dita 17-28)",
            description = "Progesteroni rritet për të përgatitur shtatzëninë. Nëse nuk ndodh, nivelet e hormoneve bien shpejt, që mund të shkaktojë simptomat e PMS.",
            tips = listOf(
                "Nëse ndiheni të irrituara apo me ankth, bëni meditim të lehtë.",
                "Zvogëloni sasinë e kripës për të shmangur fryrjen e trupit.",
                "Konsumoni magnez (çokollatë e zezë, arra, tërshërë)."
            ),
            themeColor = BubblegumPink
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Doctor advice box
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)
            )
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.Info,
                    contentDescription = null,
                    tint = CrimsonRose,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Column {
                    Text(
                        text = "Kur të konsultoheni me mjekun?",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Në rast se keni dhimbje jashtëzakonisht të forta që nuk lehtësohen me qetësues, gjakderdhje të çrregullt më shumë se 8 ditë apo mungesë cikli për më shumë se 3 muaj, ju lutem kontaktoni gjinekologun tuaj.",
                        fontSize = 11.sp,
                        lineHeight = 15.sp,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }
}

@Composable
fun InsightPhaseCard(
    title: String,
    description: String,
    tips: List<String>,
    themeColor: Color
) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .border(
                1.dp,
                if (expanded) themeColor.copy(alpha = 0.4f) else Color.Transparent,
                RoundedCornerShape(16.dp)
            )
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp).animateContentSize()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(themeColor)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = title,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                Icon(
                    imageVector = if (expanded) Icons.AutoMirrored.Filled.KeyboardArrowLeft else Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = if (expanded) "Mbyll" else "Hap",
                    tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    modifier = Modifier.size(16.dp)
                )
            }

            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = description,
                fontSize = 12.sp,
                lineHeight = 16.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
            )

            if (expanded) {
                Spacer(modifier = Modifier.height(10.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(1.dp)
                        .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = "Këshilla praktike:",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    color = themeColor
                )
                Spacer(modifier = Modifier.height(4.dp))
                tips.forEach { t ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 2.dp),
                        verticalAlignment = Alignment.Top
                    ) {
                        Text(
                            text = "•",
                            color = themeColor,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(end = 6.dp)
                        )
                        Text(
                            text = t,
                            fontSize = 11.sp,
                            lineHeight = 15.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                        )
                    }
                }
            }
        }
    }
}


// --- DIALOGS SECTION ---

// 1. SYMPTOM LOG DIALOG (For Calendar screen logging)
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun SymptomLogDialog(
    viewModel: HenaViewModel,
    logDate: LocalDate,
    existingLog: PeriodDay?,
    onDismiss: () -> Unit
) {
    var flow by remember { mutableIntStateOf(existingLog?.flow ?: 0) }
    var pain by remember { mutableIntStateOf(existingLog?.pain ?: 0) }
    var mood by remember { mutableStateOf(existingLog?.mood ?: "🌸 E qetë") }
    var notes by remember { mutableStateOf(existingLog?.notes ?: "") }

    val activeSymptoms = remember {
        mutableStateListOf<String>().apply {
            if (existingLog != null && existingLog.symptoms.isNotEmpty()) {
                addAll(existingLog.symptoms.split(","))
            }
        }
    }

    val availableSymptoms = listOf(
        "Dhimbje barku 🩸", "Dhimbje koke 🧠", "Fryrje 🎈",
        "Luhatje humori ⚡", "Lodhje 😴", "Puçrra 🌸",
        "Dhimbje gjoksi ☕", "Mungesë gjumi 💤", "Ushqim epsh 🍫"
    )

    val availableMoods = listOf(
        "😊 E lumtur", "🌸 E qetë", "😴 E lodhur",
        "⚡ E irrituar", "🥺 E ndjeshme", "🤒 Me dhimbje"
    )

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .shadow(24.dp, RoundedCornerShape(24.dp)),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.Top
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Regjistro Shenjat",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(imageVector = Icons.Filled.Close, contentDescription = "Mbyll")
                    }
                }

                Text(
                    text = viewModel.formatToAlbanianDate(logDate),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Flow picker
                Text(
                    text = "Fluksi Menstrual 🩸",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("S'ka", "Lehtë", "Mesatar", "Shumë").forEachIndexed { index, label ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (flow == index) CrimsonRose else MaterialTheme.colorScheme.background
                                )
                                .border(
                                    1.dp,
                                    if (flow == index) CrimsonRose else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { flow = index }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (flow == index) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Pain picker
                Text(
                    text = "Dhimbja e trupit ⚡",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf("S'kam", "Lehtë", "Mesatare", "Fortë").forEachIndexed { index, label ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (pain == index) TwilightPurple else MaterialTheme.colorScheme.background
                                )
                                .border(
                                    1.dp,
                                    if (pain == index) TwilightPurple else MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { pain = index }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (pain == index) Color.White else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Mood Selection
                Text(
                    text = "Humori sot 🌸",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    availableMoods.forEach { m ->
                        val isSelected = mood == m
                        Box(
                            modifier = Modifier
                                .padding(bottom = 4.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isSelected) BlossomGold else MaterialTheme.colorScheme.background
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) BlossomGold else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable { mood = m }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = m,
                                fontSize = 11.sp,
                                color = if (isSelected) Color.Black else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Symptoms Multipicker
                Text(
                    text = "Simptomat tjera",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    availableSymptoms.forEach { s ->
                        val isSelected = activeSymptoms.contains(s)
                        Box(
                            modifier = Modifier
                                .padding(bottom = 4.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    if (isSelected) MaterialTheme.colorScheme.primary.copy(alpha = 0.15f) else MaterialTheme.colorScheme.background
                                )
                                .border(
                                    1.dp,
                                    if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f),
                                    RoundedCornerShape(10.dp)
                                )
                                .clickable {
                                    if (isSelected) activeSymptoms.remove(s) else activeSymptoms.add(s)
                                }
                                .padding(horizontal = 10.dp, vertical = 6.dp)
                        ) {
                            Text(
                                text = s,
                                fontSize = 11.sp,
                                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Notes Textbox
                Text(
                    text = "Shënime shtesë",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    placeholder = { Text("Si ndiheni sot?", fontSize = 12.sp) },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                    maxLines = 3,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f),
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(text = "Anulo", fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            viewModel.saveLog(
                                flow = flow,
                                pain = pain,
                                mood = mood,
                                symptoms = activeSymptoms.toList(),
                                notes = notes
                            )
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.weight(1.5f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(text = "Ruaj", fontSize = 13.sp, color = Color.White)
                    }
                }
            }
        }
    }
}

// 2. CONFIG SETTINGS DIALOG (Toggled from dashboard gear click)
@Composable
fun SettingsDialog(
    viewModel: HenaViewModel,
    onDismiss: () -> Unit
) {
    val username by viewModel.username.collectAsStateWithLifecycle()
    val cycleLengthVal by viewModel.cycleLength.collectAsStateWithLifecycle()
    val periodLengthVal by viewModel.periodLength.collectAsStateWithLifecycle()
    val lastPeriodStartStr by viewModel.lastPeriodStart.collectAsStateWithLifecycle()

    val isPinEnabled by viewModel.isPinEnabled.collectAsStateWithLifecycle()
    val pinCode by viewModel.pinCode.collectAsStateWithLifecycle()

    val remindPeriod by viewModel.remindPeriod.collectAsStateWithLifecycle()
    val remindFertile by viewModel.remindFertile.collectAsStateWithLifecycle()
    val remindDaily by viewModel.remindDaily.collectAsStateWithLifecycle()
    val remindWater by viewModel.remindWater.collectAsStateWithLifecycle()

    var nameInput by remember { mutableStateOf(username) }
    var cycleSlider by remember { mutableIntStateOf(cycleLengthVal) }
    var periodSlider by remember { mutableIntStateOf(periodLengthVal) }
    
    // Simplifies selecting date: text input for birth/reference date
    var lastStartInput by remember { mutableStateOf(lastPeriodStartStr) }

    var isPinSetupVisible by remember { mutableStateOf(false) }
    var pinSetupStep by remember { mutableIntStateOf(1) } // 1 = Enter new PIN, 2 = Confirm new PIN, 3 = Enter existing PIN to disable
    var tempPinInput by remember { mutableStateOf("") }
    var tempPinConfirmInput by remember { mutableStateOf("") }
    var existingPinVerifyInput by remember { mutableStateOf("") }
    var pinErrorText by remember { mutableStateOf("") }
    var pinSuccessText by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 12.dp)
                .shadow(24.dp, RoundedCornerShape(24.dp)),
            shape = RoundedCornerShape(24.dp),
            color = MaterialTheme.colorScheme.surface
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.Top
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Rregullo Parametrat",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                        Icon(imageVector = Icons.Filled.Close, contentDescription = "Mbyll")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Name field
                Text(
                    text = "Emri juaj",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = nameInput,
                    onValueChange = { nameInput = it },
                    placeholder = { Text("Shkruani emrin") },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Cycle duration setting
                Text(
                    text = "Kohëzgjatja e Ciklit: $cycleSlider ditë",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = "Midis ditës së parë të një cikli dhe ciklit tjetër (zakonisht 28).",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    lineHeight = 13.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { if (cycleSlider > 18) cycleSlider-- },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.background
                        ),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Text("-", fontWeight = FontWeight.Black, fontSize = 20.sp)
                    }

                    Text(
                        text = "$cycleSlider ditë",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    IconButton(
                        onClick = { if (cycleSlider < 45) cycleSlider++ },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.background
                        ),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Text("+", fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Period duration setting
                Text(
                    text = "Kohëzgjatja e Periodave: $periodSlider ditë",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = "Sa ditë zgjat gjakderdhja zakonisht (zakonisht 3-7 ditë).",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f),
                    lineHeight = 13.sp
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(
                        onClick = { if (periodSlider > 2) periodSlider-- },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.background
                        ),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Text("-", fontWeight = FontWeight.Black, fontSize = 20.sp)
                    }

                    Text(
                        text = "$periodSlider ditë",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )

                    IconButton(
                        onClick = { if (periodSlider < 10) periodSlider++ },
                        colors = IconButtonDefaults.iconButtonColors(
                            containerColor = MaterialTheme.colorScheme.background
                        ),
                        modifier = Modifier.size(40.dp)
                    ) {
                        Text("+", fontWeight = FontWeight.Black, fontSize = 18.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Last Period Start Date
                Text(
                    text = "Data e periodave të fundit (fillimi)",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                )
                Text(
                    text = "Data ku filluan periodat e fundit në formatin: VVVV-MM-DD",
                    fontSize = 10.sp,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f)
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = lastStartInput,
                    onValueChange = { lastStartInput = it },
                    placeholder = { Text("Shembull: 2026-05-24") },
                    modifier = Modifier.fillMaxWidth(),
                    textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = MaterialTheme.colorScheme.primary,
                        unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                    )
                )

                Spacer(modifier = Modifier.height(18.dp))
                HorizontalDivider(modifier = Modifier.fillMaxWidth(), color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                Spacer(modifier = Modifier.height(14.dp))

                // PIN Security System Setup (Albanian)
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = 1.dp,
                            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(16.dp)
                        ),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .padding(14.dp)
                            .animateContentSize()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Lock,
                                contentDescription = null,
                                tint = CrimsonRose,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Privatësia & Kodi PIN 🔒",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Mbroni të dhënat tuaja shëndetësore inteligjente duke aktivizuar një kod sigurie me 4 shifra.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            lineHeight = 14.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        if (isPinEnabled) {
                            // PIN is Active status
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF10B981)) // Emerald green
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Mbrojtja me PIN është Aktive",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }

                                TextButton(
                                    onClick = {
                                        isPinSetupVisible = !isPinSetupVisible
                                        pinSetupStep = 3 // verify existing PIN to disable
                                        existingPinVerifyInput = ""
                                        tempPinInput = ""
                                        tempPinConfirmInput = ""
                                        pinErrorText = ""
                                        pinSuccessText = ""
                                    },
                                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                                ) {
                                    Text("Çaktivizo", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        } else {
                            // PIN is Inactive status
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(MaterialTheme.colorScheme.error)
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "Mbrojtja me PIN nuk është aktive",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
                                    )
                                }

                                Button(
                                    onClick = {
                                        isPinSetupVisible = !isPinSetupVisible
                                        pinSetupStep = 1 // start setup
                                        tempPinInput = ""
                                        tempPinConfirmInput = ""
                                        pinErrorText = ""
                                        pinSuccessText = ""
                                    },
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = CrimsonRose,
                                        contentColor = Color.White
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp),
                                    modifier = Modifier.defaultMinSize(minWidth = 1.dp, minHeight = 1.dp)
                                ) {
                                    Text("Aktivizo", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        if (pinSuccessText.isNotEmpty()) {
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = pinSuccessText,
                                color = Color(0xFF10B981),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Sliding/Visible Inputs for Config
                        if (isPinSetupVisible) {
                            Spacer(modifier = Modifier.height(10.dp))
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(1.dp)
                                    .background(MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                            )
                            Spacer(modifier = Modifier.height(10.dp))

                            if (pinSetupStep == 1) {
                                // Step 1: Input new PIN
                                Text(
                                    text = "Vendosni PIN-in e ri (4 shifra):",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = tempPinInput,
                                        onValueChange = { input ->
                                            if (input.all { it.isDigit() } && input.length <= 4) {
                                                tempPinInput = input
                                                pinErrorText = ""
                                            }
                                        },
                                        placeholder = { Text("P.sh. 1234") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f),
                                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                                        shape = RoundedCornerShape(10.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = CrimsonRose,
                                            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                                        )
                                    )
                                    Button(
                                        onClick = {
                                            if (tempPinInput.length != 4) {
                                                pinErrorText = "Kodi PIN duhet të ketë saktësisht 4 shifra."
                                            } else {
                                                pinSetupStep = 2 // proceed to confirm
                                                tempPinConfirmInput = ""
                                                pinErrorText = ""
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Vazhdo", fontSize = 12.sp)
                                    }
                                }
                            } else if (pinSetupStep == 2) {
                                // Step 2: Confirm new PIN
                                Text(
                                    text = "Konfirmoni PIN-in e ri:",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = tempPinConfirmInput,
                                        onValueChange = { input ->
                                            if (input.all { it.isDigit() } && input.length <= 4) {
                                                tempPinConfirmInput = input
                                                pinErrorText = ""
                                            }
                                        },
                                        placeholder = { Text("Përsërit PIN") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f),
                                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                                        shape = RoundedCornerShape(10.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = CrimsonRose,
                                            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                                        )
                                    )
                                    Button(
                                        onClick = {
                                            if (tempPinConfirmInput != tempPinInput) {
                                                pinErrorText = "Kodet PIN nuk përputhen. Provoni përsëri."
                                            } else {
                                                viewModel.savePin(tempPinInput)
                                                pinSuccessText = "Mbrojtja me PIN u aktivizua! 🔒"
                                                isPinSetupVisible = false
                                                pinErrorText = ""
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = CrimsonRose),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Ruaj", fontSize = 12.sp)
                                    }
                                }
                            } else if (pinSetupStep == 3) {
                                // Step 3: Enter existing PIN to disable
                                Text(
                                    text = "Shkruani PIN-in aktual për çaktivizim:",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    OutlinedTextField(
                                        value = existingPinVerifyInput,
                                        onValueChange = { input ->
                                            if (input.all { it.isDigit() } && input.length <= 4) {
                                                existingPinVerifyInput = input
                                                pinErrorText = ""
                                            }
                                        },
                                        placeholder = { Text("Kodi aktual") },
                                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                                        visualTransformation = PasswordVisualTransformation(),
                                        singleLine = true,
                                        modifier = Modifier.weight(1f),
                                        textStyle = androidx.compose.ui.text.TextStyle(fontSize = 13.sp),
                                        shape = RoundedCornerShape(10.dp),
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = CrimsonRose,
                                            unfocusedBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                                        )
                                    )
                                    Button(
                                        onClick = {
                                            if (existingPinVerifyInput == pinCode) {
                                                viewModel.disablePin()
                                                pinSuccessText = "Mbrojtja me PIN u çaktivizua! 🔓"
                                                isPinSetupVisible = false
                                                pinErrorText = ""
                                            } else {
                                                pinErrorText = "Kodi i pasaktë. Provoni përsëri."
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                                        shape = RoundedCornerShape(10.dp)
                                    ) {
                                        Text("Konfirmo", fontSize = 11.sp)
                                    }
                                }
                            }

                            if (pinErrorText.isNotEmpty()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = pinErrorText,
                                    color = MaterialTheme.colorScheme.error,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Custom Notifications Section (Albanian)
                val contextReg = LocalContext.current
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(
                            width = 1.dp,
                            color = MaterialTheme.colorScheme.outline.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(16.dp)
                        ),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f)
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Info,
                                contentDescription = null,
                                tint = CrimsonRose,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Njoftimet & Përkujtuesit 🔔",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                        }

                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Konfiguroni se cilat njoftime dëshironi të merrni për ciklin tuaj shëndetësor.",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f),
                            lineHeight = 14.sp
                        )

                        Spacer(modifier = Modifier.height(12.dp))

                        // Toggle 1: Period Reminder
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Përkujto fillimin e periodave",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Njofto 2 ditë përpara ciklit të parashikuar.",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Switch(
                                checked = remindPeriod,
                                onCheckedChange = { viewModel.updateReminderSetting("remind_period", it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = CrimsonRose,
                                    uncheckedThumbColor = MaterialTheme.colorScheme.outline,
                                    uncheckedTrackColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        Spacer(modifier = Modifier.height(10.dp))

                        // Toggle 2: Fertile Days Reminder
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Përkujto ditët pjellore",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Njofto kur fillon faza e ovulimit.",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Switch(
                                checked = remindFertile,
                                onCheckedChange = { viewModel.updateReminderSetting("remind_fertile", it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = CrimsonRose,
                                    uncheckedThumbColor = MaterialTheme.colorScheme.outline,
                                    uncheckedTrackColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        Spacer(modifier = Modifier.height(10.dp))

                        // Toggle 3: Daily log Reminder
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Ditari i përditshëm i shenjave",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Përkujtues çdo darkë për të regjistruar simptomat.",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Switch(
                                checked = remindDaily,
                                onCheckedChange = { viewModel.updateReminderSetting("remind_daily", it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = CrimsonRose,
                                    uncheckedThumbColor = MaterialTheme.colorScheme.outline,
                                    uncheckedTrackColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(10.dp))
                        HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.1f))
                        Spacer(modifier = Modifier.height(10.dp))

                        // Toggle 4: Hydration Tracker
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Gjurmuesi i hidratimit 💧",
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = "Përkujtues për të pirë ujë rregullisht gjatë ciklit.",
                                    fontSize = 10.sp,
                                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f)
                                )
                            }
                            Switch(
                                checked = remindWater,
                                onCheckedChange = { viewModel.updateReminderSetting("remind_water", it) },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = CrimsonRose,
                                    uncheckedThumbColor = MaterialTheme.colorScheme.outline,
                                    uncheckedTrackColor = MaterialTheme.colorScheme.surface
                                )
                            )
                        }

                        Spacer(modifier = Modifier.height(14.dp))

                        // Trigger Tester Button
                        Button(
                            onClick = {
                                val title = "Hëna 🌙 Testimi i Njoftimeve"
                                val activeToggles = mutableListOf<String>()
                                if (remindPeriod) activeToggles.add("Parashikimi i Ciklit")
                                if (remindFertile) activeToggles.add("Dritarja e Fertilitetit")
                                if (remindDaily) activeToggles.add("Regjistrimi i Ditari")
                                if (remindWater) activeToggles.add("Përkujtuesi Hidratimit")
                                
                                val contentText = if (activeToggles.isEmpty()) {
                                    "Ju keni të çaktivizuara të gjitha njoftimet."
                                } else {
                                    "Njoftimet aktive: ${activeToggles.joinToString(", ")}."
                                }
                                triggerLocalNotification(contextReg, title, contentText)
                            },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = CrimsonRose.copy(alpha = 0.1f),
                                contentColor = CrimsonRose
                            ),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Testo Njoftimet 🧪", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Config save/dismiss
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Button(
                        onClick = onDismiss,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.12f),
                            contentColor = MaterialTheme.colorScheme.onSurface
                        ),
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(text = "Rikthehu", fontSize = 13.sp)
                    }

                    Button(
                        onClick = {
                            // Validate format
                            val finalDateString = try {
                                LocalDate.parse(lastStartInput)
                                lastStartInput
                            } catch (e: Exception) {
                                lastPeriodStartStr
                            }
                            viewModel.updateSettings(
                                name = nameInput,
                                cLength = cycleSlider,
                                pLength = periodSlider,
                                lastStartStr = finalDateString
                            )
                            onDismiss()
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        ),
                        modifier = Modifier.weight(1.5f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(text = "Ruaj", fontSize = 13.sp, color = Color.White)
                    }
                }
            }
        }
    }
}

@Composable
fun PinLockScreen(viewModel: HenaViewModel) {
    var enteredCode by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }
    var feedbackMessage by remember { mutableStateOf("Shkruani PIN-in për të hapur aplikacionin") }

    LaunchedEffect(enteredCode) {
        if (enteredCode.length == 4) {
            kotlinx.coroutines.delay(150)
            val success = viewModel.unlockWithPin(enteredCode)
            if (!success) {
                isError = true
                feedbackMessage = "Kodi PIN është i pasaktë. Provoni përsëri."
                enteredCode = ""
            } else {
                isError = false
                feedbackMessage = "U hap me sukses!"
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        MaterialTheme.colorScheme.surface,
                        MaterialTheme.colorScheme.background
                    )
                )
            )
            .statusBarsPadding()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Spacer(modifier = Modifier.weight(0.8f))

        // Secure Padlock & Brand Icon
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(CrimsonRose.copy(alpha = 0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Filled.Lock,
                contentDescription = null,
                tint = CrimsonRose,
                modifier = Modifier.size(36.dp)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Hëna 🌙",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSurface
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Mbrojtja e të Dhënave",
            fontSize = 14.sp,
            fontWeight = FontWeight.Medium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Status Feedback Message
        Text(
            text = feedbackMessage,
            fontSize = 13.sp,
            textAlign = TextAlign.Center,
            color = if (isError) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f),
            fontWeight = if (isError) FontWeight.Bold else FontWeight.Normal,
            modifier = Modifier
                .padding(horizontal = 32.dp)
                .height(36.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // 4 PIN Dots (Indicators)
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            for (i in 0 until 4) {
                val isFilled = i < enteredCode.length
                val dotColor = if (isError) {
                    MaterialTheme.colorScheme.error
                } else if (isFilled) {
                    CrimsonRose
                } else {
                    MaterialTheme.colorScheme.onSurface.copy(alpha = 0.2f)
                }

                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(dotColor)
                        .border(
                            width = 1.5.dp,
                            color = if (isFilled) Color.Transparent else MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                            shape = CircleShape
                        )
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Elegant custom circular dial keypad
        val keys = listOf(
            listOf("1", "2", "3"),
            listOf("4", "5", "6"),
            listOf("7", "8", "9"),
            listOf("⌫", "0", "C")
        )

        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            keys.forEach { rowKeys ->
                Row(
                    horizontalArrangement = Arrangement.spacedBy(24.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    rowKeys.forEach { key ->
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .aspectRatio(1f)
                                .clip(CircleShape)
                                .background(
                                    if (key.isNotEmpty()) {
                                        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                                    } else {
                                        Color.Transparent
                                    }
                                )
                                .clickable(enabled = key.isNotEmpty()) {
                                    if (isError) {
                                        isError = false
                                        feedbackMessage = "Shkruani PIN-in për të hapur aplikacionin"
                                    }
                                    when (key) {
                                        "⌫" -> {
                                            if (enteredCode.isNotEmpty()) {
                                                enteredCode = enteredCode.dropLast(1)
                                            }
                                        }
                                        "C" -> {
                                            enteredCode = ""
                                        }
                                        else -> {
                                            if (enteredCode.length < 4) {
                                                enteredCode += key
                                            }
                                        }
                                    }
                                },
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = key,
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (key == "⌫" || key == "C") {
                                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                } else {
                                    MaterialTheme.colorScheme.onSurface
                                }
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.weight(0.8f))
    }
}
