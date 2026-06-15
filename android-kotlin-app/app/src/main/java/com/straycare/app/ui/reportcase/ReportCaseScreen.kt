package com.straycare.app.ui.reportcase

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.util.Log
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import coil.compose.AsyncImage
import com.google.android.gms.location.LocationServices
import com.straycare.app.data.network.ApiClient
import com.straycare.app.utils.AnimalDetectionResult
import com.straycare.app.utils.AnimalRecognizer
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import android.graphics.BitmapFactory
import android.location.Location

@Composable
fun ReportCaseScreen() {
    val context = LocalContext.current
    var permissionsGranted by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        permissionsGranted = permissions[Manifest.permission.CAMERA] == true &&
                (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                 permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true)
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(
            arrayOf(Manifest.permission.CAMERA, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION)
        )
    }

    if (permissionsGranted) {
        CameraAndLocationView(context)
    } else {
        Box(modifier = Modifier.fillMaxSize().background(Color(0xFF0F0F1A)), contentAlignment = Alignment.Center) {
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(20.dp), modifier = Modifier.padding(32.dp)) {
                Column(Modifier.padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("📷", fontSize = 48.sp)
                    Spacer(Modifier.height(16.dp))
                    Text("Permissions Required", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Camera & Location access needed to report a stray animal case.", color = Color.Gray, fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                }
            }
        }
    }
}

@SuppressLint("MissingPermission")
@Composable
fun CameraAndLocationView(context: Context) {
    val lifecycleOwner = LocalLifecycleOwner.current
    val coroutineScope = rememberCoroutineScope()

    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    var imageCapture: ImageCapture? by remember { mutableStateOf(null) }
    var capturedImageFile by remember { mutableStateOf<File?>(null) }
    var isUploading by remember { mutableStateOf(false) }
    var isAnalyzing by remember { mutableStateOf(false) }
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    var description by remember { mutableStateOf("") }
    var animalPrediction by remember { mutableStateOf<AnimalDetectionResult?>(null) }
    var animalDetected by remember { mutableStateOf<Boolean?>(null) } // null=analyzing, true=ok, false=no animal
    var currentLocation by remember { mutableStateOf<Location?>(null) }
    var reportSuccess by remember { mutableStateOf(false) }

    // Fetch location on launch
    LaunchedEffect(Unit) {
        fusedLocationClient.lastLocation.addOnSuccessListener { loc -> currentLocation = loc }
    }

    if (reportSuccess) {
        // ── Success Screen ────────────────────────────────────────
        Box(Modifier.fillMaxSize().background(Color(0xFF0F0F1A)), contentAlignment = Alignment.Center) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(32.dp)) {
                Box(Modifier.size(100.dp).clip(CircleShape).background(Color(0xFF22C55E).copy(0.15f)), contentAlignment = Alignment.Center) {
                    Text("✅", fontSize = 52.sp)
                }
                Spacer(Modifier.height(24.dp))
                Text("Case Reported!", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                Text("Our partner NGOs have been alerted and will respond shortly.", color = Color.Gray, fontSize = 14.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 10.dp))
                Spacer(Modifier.height(32.dp))
                Button(
                    onClick = { reportSuccess = false; capturedImageFile = null; description = ""; animalPrediction = null; animalDetected = null },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                    shape = RoundedCornerShape(14.dp), modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(vertical = 14.dp)
                ) { Text("Report Another Case", fontWeight = FontWeight.Bold) }
            }
        }
        return
    }

    if (capturedImageFile != null) {
        // ── Review + Submit Screen ────────────────────────────────
        Box(Modifier.fillMaxSize().background(Color(0xFF0F0F1A))) {
            Column(Modifier.fillMaxSize()) {
                // Photo preview
                Box(Modifier.fillMaxWidth().height(260.dp)) {
                    AsyncImage(
                        model = capturedImageFile,
                        contentDescription = "Captured photo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent, Color(0xFF0F0F1A)), startY = 130f)))

                    // Retake button top-left
                    Box(Modifier.fillMaxSize().padding(12.dp), contentAlignment = Alignment.TopStart) {
                        IconButton(
                            onClick = { capturedImageFile = null; animalPrediction = null; animalDetected = null },
                            modifier = Modifier.background(Color.Black.copy(0.6f), CircleShape)
                        ) { Text("✕", color = Color.White, fontSize = 18.sp) }
                    }
                }

                Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
                    Spacer(Modifier.height(8.dp))

                    // ── AI Detection Result ─────────────────────────
                    when {
                        isAnalyzing -> {
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A2E)), shape = RoundedCornerShape(14.dp)) {
                                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    CircularProgressIndicator(Modifier.size(20.dp), color = Color(0xFF8B5CF6), strokeWidth = 2.dp)
                                    Spacer(Modifier.width(12.dp))
                                    Text("AI is scanning for stray animals...", color = Color.Gray, fontSize = 13.sp)
                                }
                            }
                        }
                        animalDetected == false -> {
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFFEF4444).copy(0.12f)), shape = RoundedCornerShape(14.dp)) {
                                Column(Modifier.padding(14.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("⚠️", fontSize = 22.sp)
                                        Spacer(Modifier.width(10.dp))
                                        Text("No Animal Detected", color = Color(0xFFEF4444), fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                    }
                                    Text("Our AI couldn't detect a stray animal in this photo. Please retake with a clearer view of the animal.", color = Color(0xFFEF4444).copy(0.8f), fontSize = 12.sp, modifier = Modifier.padding(top = 6.dp))
                                    Spacer(Modifier.height(12.dp))
                                    Button(
                                        onClick = { capturedImageFile = null; animalPrediction = null; animalDetected = null },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEF4444)),
                                        shape = RoundedCornerShape(10.dp), modifier = Modifier.fillMaxWidth()
                                    ) { Text("📷 Retake Photo", fontWeight = FontWeight.Bold) }
                                }
                            }
                        }
                        animalDetected == true && animalPrediction != null -> {
                            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF22C55E).copy(0.1f)), shape = RoundedCornerShape(14.dp)) {
                                Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                                    Text(animalPrediction!!.emoji, fontSize = 28.sp)
                                    Spacer(Modifier.width(12.dp))
                                    Column {
                                        Text("✅ Animal Confirmed", color = Color(0xFF22C55E), fontWeight = FontWeight.Bold)
                                        Text("Detected: ${animalPrediction!!.label} (${animalPrediction!!.confidence}% confidence)", color = Color.Gray, fontSize = 12.sp)
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(12.dp))

                    // ── Location Card ────────────────────────────────
                    if (currentLocation != null) {
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF3B82F6).copy(0.1f)), shape = RoundedCornerShape(14.dp)) {
                            Row(Modifier.padding(12.dp).fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                                Text("📍", fontSize = 20.sp)
                                Spacer(Modifier.width(10.dp))
                                Column(Modifier.weight(1f)) {
                                    Text("GPS Location Captured", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                    Text("${String.format("%.5f", currentLocation!!.latitude)}, ${String.format("%.5f", currentLocation!!.longitude)}", color = Color.Gray, fontSize = 11.sp)
                                }
                                // Open in Maps
                                TextButton(onClick = {
                                    val uri = Uri.parse("geo:${currentLocation!!.latitude},${currentLocation!!.longitude}?q=${currentLocation!!.latitude},${currentLocation!!.longitude}(Stray+Animal)")
                                    context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                                }) { Text("View Map", color = Color(0xFF3B82F6), fontSize = 11.sp) }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                    }

                    // ── Description ──────────────────────────────────
                    if (animalDetected == true) {
                        OutlinedTextField(
                            value = description, onValueChange = { description = it },
                            label = { Text("Describe the situation...", color = Color.Gray) },
                            placeholder = { Text("e.g. Injured dog near the park gate, unable to walk", color = Color(0xFF444466)) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White, unfocusedTextColor = Color.White,
                                focusedBorderColor = Color(0xFF8B5CF6), unfocusedBorderColor = Color(0xFF2A2A3E)
                            ),
                            modifier = Modifier.fillMaxWidth().height(110.dp),
                            shape = RoundedCornerShape(14.dp), maxLines = 5
                        )
                        Spacer(Modifier.height(14.dp))

                        Button(
                            onClick = {
                                if (description.isBlank()) {
                                    Toast.makeText(context, "Please describe the situation", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                if (currentLocation == null) {
                                    Toast.makeText(context, "Waiting for GPS location...", Toast.LENGTH_SHORT).show()
                                    return@Button
                                }
                                isUploading = true
                                coroutineScope.launch {
                                    try {
                                        val requestFile = capturedImageFile!!.asRequestBody("image/jpeg".toMediaTypeOrNull())
                                        val body = MultipartBody.Part.createFormData("photo", capturedImageFile!!.name, requestFile)
                                        val latBody = currentLocation!!.latitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                                        val lngBody = currentLocation!!.longitude.toString().toRequestBody("text/plain".toMediaTypeOrNull())
                                        val descBody = description.toRequestBody("text/plain".toMediaTypeOrNull())
                                        val response = ApiClient.apiService.reportCase(body, latBody, lngBody, descBody)
                                        if (response.isSuccessful) {
                                            reportSuccess = true
                                            description = ""
                                        } else {
                                            Toast.makeText(context, "Failed to report case. Try again.", Toast.LENGTH_LONG).show()
                                        }
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                                    } finally { isUploading = false }
                                }
                            },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isUploading && animalDetected == true,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            shape = RoundedCornerShape(14.dp),
                            contentPadding = PaddingValues(vertical = 16.dp)
                        ) {
                            if (isUploading) {
                                CircularProgressIndicator(Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                                Spacer(Modifier.width(10.dp))
                                Text("Reporting Case...")
                            } else {
                                Text("🚨  Report This Animal", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            }
                        }
                    }
                }
            }
        }
    } else {
        // ── Camera View ────────────────────────────────────────────
        Box(modifier = Modifier.fillMaxSize()) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    val executor = ContextCompat.getMainExecutor(ctx)
                    cameraProviderFuture.addListener({
                        val cameraProvider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                        imageCapture = ImageCapture.Builder().build()
                        try {
                            cameraProvider.unbindAll()
                            cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageCapture)
                        } catch (e: Exception) { Log.e("CameraX", "Binding failed", e) }
                    }, executor)
                    previewView
                }
            )

            // Overlay guide
            Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.TopCenter) {
                Spacer(Modifier.height(20.dp))
                Card(colors = CardDefaults.cardColors(containerColor = Color.Black.copy(0.6f)), shape = RoundedCornerShape(12.dp)) {
                    Text("📷 Point camera at the stray animal", color = Color.White, fontSize = 13.sp, modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp))
                }
            }

            // Location indicator
            Box(Modifier.fillMaxSize().padding(16.dp), contentAlignment = Alignment.TopEnd) {
                Card(colors = CardDefaults.cardColors(containerColor = Color.Black.copy(0.6f)), shape = RoundedCornerShape(10.dp)) {
                    Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text(if (currentLocation != null) "📍" else "⏳", fontSize = 14.sp)
                        Spacer(Modifier.width(4.dp))
                        Text(if (currentLocation != null) "GPS Ready" else "Getting GPS...", color = if (currentLocation != null) Color(0xFF22C55E) else Color(0xFFF59E0B), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Capture button
            Box(Modifier.fillMaxSize().padding(bottom = 48.dp), contentAlignment = Alignment.BottomCenter) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("AI will verify the animal automatically", color = Color.White.copy(0.7f), fontSize = 12.sp, modifier = Modifier.padding(bottom = 16.dp))
                    Box(
                        Modifier.size(76.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(0.15f))
                            .clip(CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Button(
                            onClick = {
                                val file = File(context.cacheDir, "straycare_case_${System.currentTimeMillis()}.jpg")
                                val outputOptions = ImageCapture.OutputFileOptions.Builder(file).build()
                                isAnalyzing = true
                                imageCapture?.takePicture(
                                    outputOptions,
                                    ContextCompat.getMainExecutor(context),
                                    object : ImageCapture.OnImageSavedCallback {
                                        override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                                            capturedImageFile = file
                                            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
                                            AnimalRecognizer.analyze(bitmap) { result ->
                                                isAnalyzing = false
                                                animalPrediction = result
                                                animalDetected = result != null
                                            }
                                        }
                                        override fun onError(exception: ImageCaptureException) {
                                            isAnalyzing = false
                                            Log.e("CameraX", "Photo capture failed: ${exception.message}", exception)
                                        }
                                    }
                                )
                            },
                            modifier = Modifier.size(64.dp),
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF8B5CF6)),
                            contentPadding = PaddingValues(0.dp)
                        ) { Text("📷", fontSize = 28.sp) }
                    }
                }
            }
        }
    }
}
