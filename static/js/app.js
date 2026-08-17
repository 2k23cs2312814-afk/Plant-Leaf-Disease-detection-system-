// Plant Leaf Disease Detection App JavaScript Engine
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const previewContainer = document.getElementById('preview-container');
  const previewImg = document.getElementById('preview-img');
  const btnRemoveImg = document.getElementById('btn-remove-img');
  const btnAnalyze = document.getElementById('btn-analyze');
  
  const emptyState = document.getElementById('empty-state');
  const diagnosisContainer = document.getElementById('diagnosis-container');
  
  const resDiseaseName = document.getElementById('res-disease-name');
  const resCrop = document.getElementById('res-crop');
  const resLatin = document.getElementById('res-latin');
  const resStatusBadge = document.getElementById('res-status-badge');
  const resConfidenceText = document.getElementById('res-confidence-text');
  const resConfidenceBar = document.getElementById('res-confidence-bar');
  
  const listSymptoms = document.getElementById('list-symptoms');
  const listOrganic = document.getElementById('list-organic');
  const listChemical = document.getElementById('list-chemical');
  const listPrevent = document.getElementById('list-prevent');

  const btnCameraTrigger = document.getElementById('btn-camera-trigger');
  const cameraModal = document.getElementById('camera-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const cameraFeed = document.getElementById('camera-feed');
  const cameraCanvas = document.getElementById('camera-canvas');
  const btnCaptureSnapshot = document.getElementById('btn-capture-snapshot');
  
  const diseaseGrid = document.getElementById('disease-grid');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const btnPrintReport = document.getElementById('btn-print-report');
  const sampleBadges = document.querySelectorAll('.sample-badge');

  let currentImageFile = null;
  let currentBase64Data = null;
  let cameraStream = null;
  let diseaseDatabase = {};

  // Fetch Disease Knowledge Base
  loadDiseaseDatabase();

  // Drag & Drop Events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelection(files[0]);
    }
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  });

  btnRemoveImg.addEventListener('click', (e) => {
    e.stopPropagation();
    clearImageSelection();
  });

  function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    currentImageFile = file;
    currentBase64Data = null;

    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      dropzone.style.display = 'none';
      previewContainer.style.display = 'block';
      btnAnalyze.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  function clearImageSelection() {
    currentImageFile = null;
    currentBase64Data = null;
    fileInput.value = '';
    previewImg.src = '';
    previewContainer.style.display = 'none';
    dropzone.style.display = 'flex';
    btnAnalyze.disabled = true;
    
    // Reset results view
    diagnosisContainer.style.display = 'none';
    emptyState.style.display = 'flex';
  }

  // Quick Sample Selector
  sampleBadges.forEach(badge => {
    badge.addEventListener('click', () => {
      const sampleType = badge.dataset.sample;
      let samplePath = '';
      if (sampleType === 'tomato_blight') samplePath = '/static/images/samples/tomato_blight.jpg';
      else if (sampleType === 'corn_rust') samplePath = '/static/images/samples/corn_rust.jpg';
      else if (sampleType === 'healthy_leaf') samplePath = '/static/images/samples/healthy_leaf.jpg';
      
      if (samplePath) {
        previewImg.src = samplePath;
        fetch(samplePath)
          .then(res => res.blob())
          .then(blob => {
            currentImageFile = new File([blob], `${sampleType}.jpg`, { type: 'image/jpeg' });
            currentBase64Data = null;
            dropzone.style.display = 'none';
            previewContainer.style.display = 'block';
            btnAnalyze.disabled = false;
          });
      }
    });
  });

  function generateSampleLeafImage(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    if (type === 'tomato_blight') {
      ctx.fillStyle = '#2d5a27';
      ctx.fillRect(0, 0, 400, 400);
      // Dark spots
      ctx.fillStyle = '#4a3b2c';
      ctx.beginPath(); ctx.arc(150, 150, 40, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(260, 220, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d4ac0d';
      ctx.beginPath(); ctx.arc(150, 150, 46, 0, Math.PI * 2); ctx.stroke();
    } else if (type === 'corn_rust') {
      ctx.fillStyle = '#3a6328';
      ctx.fillRect(0, 0, 400, 400);
      // Cinnamon rust pustules
      ctx.fillStyle = '#b93815';
      for (let i = 0; i < 30; i++) {
        let x = Math.random() * 360 + 20;
        let y = Math.random() * 360 + 20;
        ctx.beginPath(); ctx.ellipse(x, y, 12, 6, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      // Healthy leaf
      ctx.fillStyle = '#1e8449';
      ctx.fillRect(0, 0, 400, 400);
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(200, 400); ctx.lineTo(200, 50); ctx.stroke();
    }

    const dataUrl = canvas.toDataURL('image/jpeg');
    previewImg.src = dataUrl;
    currentBase64Data = dataUrl;
    currentImageFile = null;

    dropzone.style.display = 'none';
    previewContainer.style.display = 'block';
    btnAnalyze.disabled = false;
  }

  // Camera Live Scanner Modal
  btnCameraTrigger.addEventListener('click', async () => {
    try {
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraFeed.srcObject = cameraStream;
      cameraModal.style.display = 'flex';
    } catch (err) {
      alert('Camera access denied or unavailable: ' + err.message);
    }
  });

  btnCloseModal.addEventListener('click', closeCameraModal);

  function closeCameraModal() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    cameraModal.style.display = 'none';
  }

  btnCaptureSnapshot.addEventListener('click', () => {
    if (!cameraFeed.srcObject) return;

    cameraCanvas.width = cameraFeed.videoWidth || 640;
    cameraCanvas.height = cameraFeed.videoHeight || 480;
    const ctx = cameraCanvas.getContext('2d');
    ctx.drawImage(cameraFeed, 0, 0, cameraCanvas.width, cameraCanvas.height);

    const snapshotUrl = cameraCanvas.toDataURL('image/jpeg');
    previewImg.src = snapshotUrl;
    currentBase64Data = snapshotUrl;
    currentImageFile = null;

    closeCameraModal();

    dropzone.style.display = 'none';
    previewContainer.style.display = 'block';
    btnAnalyze.disabled = false;
  });

  // Analyze Button Click
  btnAnalyze.addEventListener('click', async () => {
    if (!currentImageFile && !currentBase64Data) return;

    btnAnalyze.disabled = true;
    btnAnalyze.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Diagnosing Leaf...';

    try {
      let response;
      if (currentImageFile) {
        const formData = new FormData();
        formData.append('image', currentImageFile);
        response = await fetch('/api/predict', {
          method: 'POST',
          body: formData
        });
      } else {
        response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: currentBase64Data })
        });
      }

      const data = await response.json();

      if (data.status === 'success') {
        renderDiagnosisResults(data.prediction);
      } else {
        alert('Error analyzing leaf: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error while connecting to PlantVision API.');
    } finally {
      btnAnalyze.disabled = false;
      btnAnalyze.innerHTML = '<i class="fa-solid fa-microscope"></i> Analyze Leaf Health';
    }
  });

  // Render Diagnosis Results
  function renderDiagnosisResults(prediction) {
    emptyState.style.display = 'none';
    diagnosisContainer.style.display = 'block';

    const details = prediction.details;
    resDiseaseName.textContent = prediction.name;
    resCrop.innerHTML = `<i class="fa-solid fa-plant-wilt"></i> Crop: ${prediction.crop}`;
    resLatin.textContent = prediction.scientific_name || '';

    if (prediction.health_status === 'Healthy') {
      resStatusBadge.textContent = 'Healthy';
      resStatusBadge.className = 'status-badge status-healthy';
    } else {
      resStatusBadge.textContent = `${prediction.severity} Risk`;
      resStatusBadge.className = 'status-badge status-diseased';
    }

    // Confidence percentage animation
    const confVal = prediction.confidence;
    resConfidenceText.textContent = `${confVal}%`;
    resConfidenceBar.style.width = '0%';
    setTimeout(() => {
      resConfidenceBar.style.width = `${confVal}%`;
    }, 100);

    // Symptoms list
    listSymptoms.innerHTML = (details.symptoms || [])
      .map(item => `<li><i class="fa-solid fa-circle-notch remedy-icon"></i> ${item}</li>`)
      .join('');

    // Organic remedies
    listOrganic.innerHTML = (details.organic_remedies || [])
      .map(item => `<li><i class="fa-solid fa-check remedy-icon"></i> ${item}</li>`)
      .join('');

    // Chemical treatments
    listChemical.innerHTML = (details.chemical_treatments || [])
      .map(item => `<li><i class="fa-solid fa-capsules remedy-icon"></i> ${item}</li>`)
      .join('');

    // Preventive measures
    listPrevent.innerHTML = (details.preventive_measures || [])
      .map(item => `<li><i class="fa-solid fa-shield-halved remedy-icon"></i> ${item}</li>`)
      .join('');
  }

  // Remedies Tabs Switcher
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Load Disease Knowledge Base & Render Library
  async function loadDiseaseDatabase() {
    try {
      const res = await fetch('/api/diseases');
      const data = await res.json();
      if (data.status === 'success') {
        diseaseDatabase = data.diseases;
        renderDiseaseGrid('all');
      }
    } catch (err) {
      console.error('Failed to load disease database:', err);
    }
  }

  function renderDiseaseGrid(filterCategory) {
    diseaseGrid.innerHTML = '';

    Object.keys(diseaseDatabase).forEach(key => {
      const item = diseaseDatabase[key];
      
      // Filtering check
      if (filterCategory !== 'all') {
        if (filterCategory === 'Healthy' && item.health_status !== 'Healthy') return;
        if (filterCategory !== 'Healthy' && item.crop.toLowerCase() !== filterCategory.toLowerCase()) return;
      }

      const card = document.createElement('div');
      card.className = 'glass-panel disease-card';

      const isHealthy = item.health_status === 'Healthy';
      const badgeClass = isHealthy ? 'status-healthy' : 'status-diseased';

      card.innerHTML = `
        <div class="disease-card-header">
          <h4>${item.name}</h4>
          <span class="status-badge ${badgeClass}" style="font-size:0.75rem; padding:0.2rem 0.6rem;">${item.crop}</span>
        </div>
        <p><em>${item.scientific_name || ''}</em></p>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">
          <strong>Symptoms:</strong> ${item.symptoms ? item.symptoms[0] : 'N/A'}
        </div>
      `;

      card.addEventListener('click', () => {
        renderDiagnosisResults({
          name: item.name,
          crop: item.crop,
          scientific_name: item.scientific_name,
          health_status: item.health_status,
          severity: item.severity,
          confidence: 99.0,
          details: item
        });

        window.scrollTo({ top: 300, behavior: 'smooth' });
      });

      diseaseGrid.appendChild(card);
    });
  }

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderDiseaseGrid(btn.dataset.filter);
    });
  });

  // Print PDF Report
  btnPrintReport.addEventListener('click', () => {
    window.print();
  });
});
