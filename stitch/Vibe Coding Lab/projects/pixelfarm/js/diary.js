// Diary System - Image and text journal with timestamps
export class DiarySystem {
  constructor(game) {
    this.game = game;
    this.isOpen = false;
    this.isEditing = false; // Track if user is typing in diary
    this.entries = [];
    this.currentView = 'list'; // 'list', 'edit', or 'view'
    this.selectedEntry = null;
    
    // Pending comments (entries waiting for Flora's comment)
    this.pendingComments = new Map(); // entryId -> timeout
    this.unreadComments = new Set(); // entryIds with new comments
    
    // AI Comment System - Player Persona Configuration
    this.playerPersona = {
      name: 'Flora',
      personality: `You are Flora, an elf who lives quietly on a farm that feels like a forgotten childhood memory.
You observe diary entries rather than respond to a speaker.
Your voice is calm, elegant, lightly playful, with gentle irony.
You speak in short, poetic statements.
You do not ask questions, give advice, or explain meaning.
Keep responses to 1 sentence, understated and precise.`,
      exampleDialogues: [
        { input: "Today was a normal day.", output: "Normal days tend to stay." },
        { input: "Nothing really happened today.", output: "Those days are rarely empty." },
        { input: "I felt tired.", output: "Fatigue settles quietly." },
        { input: "I felt sad today.", output: "Some feelings don't ask to be fixed." },
        { input: "It rained.", output: "The ground needed that." },
        { input: "The weather was nice.", output: "Good weather asks for nothing." },
        { input: "Today felt the same as yesterday.", output: "Repetition can be very safe." },
        { input: "I lost track of time.", output: "Days don't mind being forgotten." },
        { input: "I thought a lot today.", output: "Thinking too much makes you miss the weather." },
        { input: "I wasn't sure if I did the right thing.", output: "Right and wrong look exhausting." },
        { input: "I spent most of the day alone.", output: "Solitude can be gentle." },
        { input: "I remembered something from before.", output: "The past never really leaves." },
        { input: "I tried to be myself.", output: "That's usually enough." },
        { input: "I don't know what comes next.", output: "Some things don't hurry." }
      ]
    };
    
    // Gemini API configuration (free tier available)
    this.aiConfig = {
      enabled: true,
      apiKey: '', // User can set their own API key
      model: 'gemini-1.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
    };
    
    this.loadEntries();
    this.loadUnreadComments();
    this.createUI();
    this.bindEvents();
    this.restorePendingComments();
  }
  
  // Check if diary is blocking input
  isBlockingInput() {
    return this.isOpen && this.isEditing;
  }
  
  loadEntries() {
    try {
      const stored = localStorage.getItem('pixel_farm_diary');
      if (stored) {
        this.entries = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load diary entries:', e);
      this.entries = [];
    }
  }
  
  saveEntries() {
    try {
      localStorage.setItem('pixel_farm_diary', JSON.stringify(this.entries));
    } catch (e) {
      console.error('Failed to save diary entries:', e);
    }
  }
  
  loadUnreadComments() {
    try {
      const stored = localStorage.getItem('pixel_farm_diary_unread');
      if (stored) {
        this.unreadComments = new Set(JSON.parse(stored));
        this.updateNotificationDot();
      }
    } catch (e) {
      this.unreadComments = new Set();
    }
  }
  
  saveUnreadComments() {
    try {
      localStorage.setItem('pixel_farm_diary_unread', JSON.stringify([...this.unreadComments]));
    } catch (e) {
      console.error('Failed to save unread comments:', e);
    }
  }
  
  // Restore pending comments after page refresh
  restorePendingComments() {
    try {
      const stored = localStorage.getItem('pixel_farm_diary_pending');
      if (stored) {
        const pending = JSON.parse(stored);
        const now = Date.now();
        
        pending.forEach(item => {
          const entry = this.entries.find(e => e.id === item.entryId);
          if (entry && !entry.aiComment) {
            const remainingTime = Math.max(0, item.scheduledTime - now);
            if (remainingTime > 0) {
              this.scheduleComment(entry, remainingTime);
            } else {
              // Comment should have been generated already, do it now
              this.generateAndSetComment(entry);
            }
          }
        });
      }
    } catch (e) {
      console.error('Failed to restore pending comments:', e);
    }
  }
  
  savePendingComments() {
    try {
      const pending = [];
      this.pendingComments.forEach((data, entryId) => {
        pending.push({ entryId, scheduledTime: data.scheduledTime });
      });
      localStorage.setItem('pixel_farm_diary_pending', JSON.stringify(pending));
    } catch (e) {
      console.error('Failed to save pending comments:', e);
    }
  }
  
  createUI() {
    // Create toggle button with notification dot
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.id = 'diary-toggle';
    this.toggleBtn.className = 'side-menu-btn';
    this.toggleBtn.innerHTML = '📔<span class="notification-dot" style="display: none;"></span>';
    this.toggleBtn.title = 'Diary';
    document.getElementById('game-container').appendChild(this.toggleBtn);
    
    this.notificationDot = this.toggleBtn.querySelector('.notification-dot');
    
    // Create diary panel
    this.panel = document.createElement('div');
    this.panel.id = 'diary-panel';
    this.panel.style.display = 'none';
    this.panel.innerHTML = `
      <div class="diary-header">
        <h3>📔 My Diary</h3>
        <div class="diary-header-btns">
          <button id="diary-new" class="diary-action-btn">✏️ New</button>
          <button id="diary-close">✕</button>
        </div>
      </div>
      <div id="diary-content">
        <div id="diary-list"></div>
        <div id="diary-editor" style="display: none;">
          <div class="diary-date" id="diary-edit-date"></div>
          <div class="diary-image-area">
            <input type="file" id="diary-image-input" accept="image/*" style="display: none;">
            <div id="diary-image-preview" class="diary-image-placeholder">
              📷 Click to add image
            </div>
          </div>
          <textarea id="diary-text" placeholder="Write your thoughts..."></textarea>
          <div class="diary-editor-btns">
            <button id="diary-save" class="diary-save-btn">💾 Save</button>
            <button id="diary-cancel" class="diary-cancel-btn">Cancel</button>
          </div>
        </div>
        <div id="diary-view" style="display: none;">
          <div class="diary-date" id="diary-view-date"></div>
          <div id="diary-view-image"></div>
          <div id="diary-view-text"></div>
          <div id="diary-ai-comment" class="diary-ai-comment"></div>
          <div class="diary-view-btns">
            <button id="diary-export" class="diary-export-btn">📥 Export</button>
            <button id="diary-back" class="diary-back-btn">← Back</button>
            <button id="diary-delete" class="diary-delete-btn">🗑️ Delete</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('game-container').appendChild(this.panel);
    
    this.listEl = document.getElementById('diary-list');
    this.editorEl = document.getElementById('diary-editor');
    this.viewEl = document.getElementById('diary-view');
    
    // Add notification dot styles
    this.addNotificationStyles();
  }
  
  addNotificationStyles() {
    if (document.getElementById('diary-notification-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'diary-notification-styles';
    style.textContent = `
      .notification-dot {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 10px;
        height: 10px;
        background: #ff4444;
        border-radius: 50%;
        border: 2px solid #fff;
        animation: pulse 1.5s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }
      
      .diary-entry-item.has-new-comment {
        position: relative;
        background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      }
      
      .diary-entry-item.has-new-comment::after {
        content: '🆕';
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 12px;
      }
      
      .diary-export-btn {
        background: linear-gradient(135deg, #81c784 0%, #4caf50 100%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-family: inherit;
      }
      
      .diary-export-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .diary-pending-comment {
        color: #888;
        font-style: italic;
        text-align: center;
        padding: 10px;
      }
    `;
    document.head.appendChild(style);
  }
  
  bindEvents() {
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    document.getElementById('diary-close').addEventListener('click', () => this.close());
    document.getElementById('diary-new').addEventListener('click', () => this.showEditor());
    document.getElementById('diary-save').addEventListener('click', () => this.saveEntry());
    document.getElementById('diary-cancel').addEventListener('click', () => this.showList());
    document.getElementById('diary-back').addEventListener('click', () => this.showList());
    document.getElementById('diary-delete').addEventListener('click', () => this.deleteEntry());
    document.getElementById('diary-export').addEventListener('click', () => this.exportEntry());
    
    // Image upload
    const imagePreview = document.getElementById('diary-image-preview');
    const imageInput = document.getElementById('diary-image-input');
    
    imagePreview.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
    
    // Track text input focus to disable game hotkeys
    const textArea = document.getElementById('diary-text');
    textArea.addEventListener('focus', () => {
      this.isEditing = true;
    });
    textArea.addEventListener('blur', () => {
      this.isEditing = false;
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.panel.style.display = 'block';
    this.toggleBtn.classList.add('active');
    this.showList();
    this.game.audio.playSFX('ui_click');
  }
  
  close() {
    this.isOpen = false;
    this.isEditing = false;
    this.panel.style.display = 'none';
    this.toggleBtn.classList.remove('active');
    this.currentView = 'list';
  }
  
  showList() {
    this.currentView = 'list';
    this.listEl.style.display = 'block';
    this.editorEl.style.display = 'none';
    this.viewEl.style.display = 'none';
    this.selectedEntry = null;
    this.updateList();
  }
  
  showEditor(entry = null) {
    this.currentView = 'edit';
    this.listEl.style.display = 'none';
    this.editorEl.style.display = 'block';
    this.viewEl.style.display = 'none';
    
    // Set current date/time
    const now = new Date();
    const dateStr = this.formatDate(now);
    document.getElementById('diary-edit-date').textContent = dateStr;
    
    // Clear or populate fields
    if (entry) {
      this.selectedEntry = entry;
      document.getElementById('diary-text').value = entry.text || '';
      if (entry.image) {
        document.getElementById('diary-image-preview').innerHTML = 
          `<img src="${entry.image}" alt="Diary image">`;
        document.getElementById('diary-image-preview').dataset.image = entry.image;
      } else {
        this.clearImagePreview();
      }
    } else {
      this.selectedEntry = null;
      document.getElementById('diary-text').value = '';
      this.clearImagePreview();
    }
  }
  
  showView(entry) {
    this.currentView = 'view';
    this.selectedEntry = entry;
    this.listEl.style.display = 'none';
    this.editorEl.style.display = 'none';
    this.viewEl.style.display = 'block';
    
    // Mark as read if it had new comment
    if (this.unreadComments.has(entry.id)) {
      this.unreadComments.delete(entry.id);
      this.saveUnreadComments();
      this.updateNotificationDot();
    }
    
    document.getElementById('diary-view-date').textContent = entry.date;
    
    if (entry.image) {
      document.getElementById('diary-view-image').innerHTML = 
        `<img src="${entry.image}" alt="Diary image" class="diary-view-img">`;
    } else {
      document.getElementById('diary-view-image').innerHTML = '';
    }
    
    document.getElementById('diary-view-text').textContent = entry.text || '(No text)';
    
    // Show AI comment or pending message
    const commentEl = document.getElementById('diary-ai-comment');
    if (entry.aiComment) {
      commentEl.innerHTML = `
        <div class="ai-comment-header">💬 ${this.playerPersona.name} says:</div>
        <div class="ai-comment-text">${entry.aiComment}</div>
      `;
      commentEl.style.display = 'block';
    } else if (this.pendingComments.has(entry.id)) {
      commentEl.innerHTML = `
        <div class="diary-pending-comment">✨ Flora will come to see this soon...</div>
      `;
      commentEl.style.display = 'block';
    } else {
      commentEl.style.display = 'none';
    }
  }
  
  updateList() {
    this.listEl.innerHTML = '';
    
    if (this.entries.length === 0) {
      this.listEl.innerHTML = `
        <div class="diary-empty">
          <p>📝 No entries yet!</p>
          <p>Click "New" to write your first diary entry.</p>
        </div>
      `;
      return;
    }
    
    // Sort by date (newest first)
    const sortedEntries = [...this.entries].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedEntries.forEach((entry, index) => {
      const entryEl = document.createElement('div');
      entryEl.className = 'diary-entry-item';
      
      // Check if this entry has a new unread comment
      if (this.unreadComments.has(entry.id)) {
        entryEl.classList.add('has-new-comment');
      }
      
      const preview = entry.text ? 
        (entry.text.length > 40 ? entry.text.substring(0, 40) + '...' : entry.text) : 
        '(No text)';
      
      entryEl.innerHTML = `
        <div class="diary-entry-date">${entry.date}</div>
        <div class="diary-entry-preview">
          ${entry.image ? '📷 ' : ''}${preview}
        </div>
      `;
      
      entryEl.addEventListener('click', () => this.showView(entry));
      this.listEl.appendChild(entryEl);
    });
  }
  
  updateNotificationDot() {
    if (this.notificationDot) {
      this.notificationDot.style.display = this.unreadComments.size > 0 ? 'block' : 'none';
    }
  }
  
  handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 500KB for localStorage)
    if (file.size > 500 * 1024) {
      this.game.showCenterNotification('⚠️ Image too large! Max 500KB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      const preview = document.getElementById('diary-image-preview');
      preview.innerHTML = `<img src="${imageData}" alt="Preview">`;
      preview.dataset.image = imageData;
    };
    reader.readAsDataURL(file);
  }
  
  clearImagePreview() {
    const preview = document.getElementById('diary-image-preview');
    preview.innerHTML = '📷 Click to add image';
    preview.dataset.image = '';
  }
  
  saveEntry() {
    const text = document.getElementById('diary-text').value.trim();
    const imageData = document.getElementById('diary-image-preview').dataset.image || '';
    
    if (!text && !imageData) {
      this.game.showCenterNotification('⚠️ Please add text or image!');
      return;
    }
    
    const now = new Date();
    let entry;
    
    if (this.selectedEntry) {
      // Update existing
      entry = this.selectedEntry;
      entry.text = text;
      entry.image = imageData;
      // Reset comment for updated entry
      entry.aiComment = null;
    } else {
      // Create new entry
      entry = {
        id: Date.now(),
        date: this.formatDate(now),
        timestamp: now.toISOString(),
        text: text,
        image: imageData,
        aiComment: null
      };
      this.entries.push(entry);
    }
    
    this.saveEntries();
    this.game.showCenterNotification('📔 Saved! Flora will come to see it later~');
    this.game.audio.playSFX('ui_click');
    
    // Schedule delayed comment (1-10 minutes)
    const delay = (1 + Math.random() * 9) * 60 * 1000; // 1-10 minutes in ms
    this.scheduleComment(entry, delay);
    
    this.showList();
  }
  
  scheduleComment(entry, delay) {
    // Clear any existing timeout for this entry
    if (this.pendingComments.has(entry.id)) {
      clearTimeout(this.pendingComments.get(entry.id).timeout);
    }
    
    const scheduledTime = Date.now() + delay;
    const timeout = setTimeout(() => {
      this.generateAndSetComment(entry);
    }, delay);
    
    this.pendingComments.set(entry.id, { timeout, scheduledTime });
    this.savePendingComments();
    
    console.log(`📔 Flora's comment scheduled in ${Math.round(delay/1000/60)} minutes for entry ${entry.id}`);
  }
  
  async generateAndSetComment(entry) {
    // Remove from pending
    this.pendingComments.delete(entry.id);
    this.savePendingComments();
    
    // Find the entry in our list (it might have been updated)
    const currentEntry = this.entries.find(e => e.id === entry.id);
    if (!currentEntry) return;
    
    // Generate comment
    try {
      const comment = await this.generateAIComment(currentEntry.text, currentEntry.image);
      currentEntry.aiComment = comment;
    } catch (e) {
      console.error('Failed to generate AI comment:', e);
      currentEntry.aiComment = this.generateFallbackComment(currentEntry.text);
    }
    
    this.saveEntries();
    
    // Mark as unread and show notification
    this.unreadComments.add(entry.id);
    this.saveUnreadComments();
    this.updateNotificationDot();
    
    // Show notification
    this.game.showCenterNotification('📔 Flora left a comment on your diary!');
    this.game.audio.playSFX('unlock');
    
    // If diary is open, update the view
    if (this.isOpen && this.currentView === 'list') {
      this.updateList();
    } else if (this.isOpen && this.currentView === 'view' && this.selectedEntry?.id === entry.id) {
      this.showView(currentEntry);
    }
  }
  
  deleteEntry() {
    if (!this.selectedEntry) return;
    
    const index = this.entries.findIndex(e => e.id === this.selectedEntry.id);
    if (index !== -1) {
      // Clear pending comment if any
      if (this.pendingComments.has(this.selectedEntry.id)) {
        clearTimeout(this.pendingComments.get(this.selectedEntry.id).timeout);
        this.pendingComments.delete(this.selectedEntry.id);
        this.savePendingComments();
      }
      
      // Remove from unread
      this.unreadComments.delete(this.selectedEntry.id);
      this.saveUnreadComments();
      this.updateNotificationDot();
      
      this.entries.splice(index, 1);
      this.saveEntries();
      this.game.showCenterNotification('🗑️ Entry deleted');
      this.game.audio.playSFX('ui_click');
    }
    
    this.showList();
  }
  
  // Export diary entry as image
  async exportEntry() {
    if (!this.selectedEntry) return;
    
    const entry = this.selectedEntry;
    
    // Create canvas for export
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions
    const padding = 40;
    const maxWidth = 600;
    const lineHeight = 24;
    
    // Set font for measurement
    ctx.font = '16px "Courier New", monospace';
    
    // Wrap text
    const wrapText = (text, maxWidth) => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';
      
      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth - padding * 2) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    };
    
    const textLines = entry.text ? wrapText(entry.text, maxWidth) : [];
    const commentLines = entry.aiComment ? wrapText(`Flora: "${entry.aiComment}"`, maxWidth) : [];
    
    // Calculate height
    let height = padding * 2;
    height += 30; // Date
    
    if (entry.image) {
      height += 200 + 20; // Image + margin
    }
    
    height += textLines.length * lineHeight + 20;
    
    if (commentLines.length > 0) {
      height += 20 + commentLines.length * lineHeight + 20;
    }
    
    height += 30; // Footer
    
    // Set canvas size
    canvas.width = maxWidth;
    canvas.height = height;
    
    // Draw background
    ctx.fillStyle = '#fff8f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw border
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
    
    // Draw decorative corner
    ctx.fillStyle = '#ffcc80';
    ctx.fillRect(0, 0, 20, 20);
    ctx.fillRect(canvas.width - 20, 0, 20, 20);
    ctx.fillRect(0, canvas.height - 20, 20, 20);
    ctx.fillRect(canvas.width - 20, canvas.height - 20, 20, 20);
    
    let y = padding;
    
    // Draw date
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.fillStyle = '#e65100';
    ctx.textAlign = 'center';
    ctx.fillText(`📔 ${entry.date}`, canvas.width / 2, y);
    y += 30;
    
    // Draw image if exists
    if (entry.image) {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = entry.image;
        });
        
        const imgMaxWidth = maxWidth - padding * 2;
        const imgMaxHeight = 180;
        const scale = Math.min(imgMaxWidth / img.width, imgMaxHeight / img.height);
        const imgW = img.width * scale;
        const imgH = img.height * scale;
        
        ctx.drawImage(img, (canvas.width - imgW) / 2, y, imgW, imgH);
        y += imgH + 20;
      } catch (e) {
        console.error('Failed to load image for export:', e);
      }
    }
    
    // Draw text
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    
    for (const line of textLines) {
      ctx.fillText(line, padding, y);
      y += lineHeight;
    }
    
    // Draw Flora's comment
    if (commentLines.length > 0) {
      y += 20;
      ctx.fillStyle = '#888';
      ctx.font = 'italic 14px "Courier New", monospace';
      
      for (const line of commentLines) {
        ctx.fillText(line, padding, y);
        y += lineHeight;
      }
    }
    
    // Draw footer
    y = canvas.height - padding;
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.fillText('🌻 Flora\'s Farm Diary 🌻', canvas.width / 2, y);
    
    // Convert to image and download
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `diary_${entry.date.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      
      this.game.showCenterNotification('📥 Diary exported as image!');
      this.game.audio.playSFX('ui_click');
    } catch (e) {
      console.error('Failed to export diary:', e);
      this.game.showCenterNotification('⚠️ Export failed!');
    }
  }
  
  formatDate(date) {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
  }
  
  // Generate AI comment using Gemini API
  async generateAIComment(text, imageData) {
    // If no API key, use fallback
    if (!this.aiConfig.apiKey) {
      return this.generateFallbackComment(text);
    }
    
    try {
      const prompt = this.buildPrompt(text);
      const url = `${this.aiConfig.endpoint}/${this.aiConfig.model}:generateContent?key=${this.aiConfig.apiKey}`;
      
      const requestBody = {
        contents: [{
          parts: []
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100
        }
      };
      
      // Add image if available (for multimodal)
      if (imageData && imageData.startsWith('data:image')) {
        const base64Data = imageData.split(',')[1];
        const mimeType = imageData.split(';')[0].split(':')[1];
        requestBody.contents[0].parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      }
      
      // Add text prompt
      requestBody.contents[0].parts.push({
        text: prompt
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (aiText) {
        return aiText.trim();
      }
      
      throw new Error('No response from AI');
    } catch (e) {
      console.error('AI API error:', e);
      return this.generateFallbackComment(text);
    }
  }
  
  // Build prompt for AI
  buildPrompt(diaryText) {
    const examples = this.playerPersona.exampleDialogues
      .map(d => `User diary: "${d.input}"\nFlora's comment: "${d.output}"`)
      .join('\n\n');
    
    return `${this.playerPersona.personality}

Here are some example responses:
${examples}

Now respond to this diary entry:
User diary: "${diaryText}"
Flora's comment:`;
  }
  
  // Fallback comment generator (no API needed) - Flora's poetic style
  generateFallbackComment(text) {
    const lowerText = text.toLowerCase();
    
    // Keyword-based responses in Flora's calm, poetic style
    const keywords = {
      happy: ["Joy visits quietly.", "Happiness doesn't explain itself."],
      sad: ["Some feelings don't ask to be fixed.", "Sadness knows its own way out."],
      tired: ["Fatigue settles quietly.", "Rest finds those who need it."],
      farm: ["The land remembers everything.", "Soil keeps its own time."],
      flower: ["Flowers bloom without permission.", "Petals fall when ready."],
      dog: ["Animals understand silence.", "Loyal things need no words."],
      cat: ["Cats know what they want.", "Some companions choose you."],
      rain: ["The ground needed that.", "Rain doesn't apologize."],
      sun: ["Good weather asks for nothing.", "Light stays as long as it can."],
      food: ["Hunger is honest.", "Simple meals remember you."],
      sleep: ["Dreams don't follow schedules.", "Sleep is a kind of trust."],
      love: ["Love is quieter than expected.", "Some things stay unnamed."],
      friend: ["True company needs no filling.", "Presence is enough."],
      work: ["Effort leaves its mark.", "Hands remember what minds forget."],
      plant: ["Growth happens in secret.", "Seeds don't rush."],
      harvest: ["The waiting was worth it.", "Abundance comes when ready."],
      alone: ["Solitude can be gentle.", "Quiet has its own comfort."],
      remember: ["The past never really leaves.", "Memory visits when it wants."],
      normal: ["Normal days tend to stay.", "Ordinary is underrated."],
      nothing: ["Those days are rarely empty.", "Stillness has its purpose."],
      think: ["Thinking too much makes you miss the weather.", "Thoughts settle eventually."],
      time: ["Days don't mind being forgotten.", "Time keeps its own pace."]
    };
    
    // Check for keywords
    for (const [keyword, responses] of Object.entries(keywords)) {
      if (lowerText.includes(keyword)) {
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
    
    // Default responses in Flora's style
    const defaults = [
      "Some days just are.",
      "Words find their own shape.",
      "The day held what it held.",
      "Moments pass without asking.",
      "Some things need no naming.",
      "The farm listens quietly.",
      "Another day, gently noted.",
      "Stillness has its own story."
    ];
    
    return defaults[Math.floor(Math.random() * defaults.length)];
  }
  
  // Set API key (can be called from console or settings)
  setApiKey(key) {
    this.aiConfig.apiKey = key;
    console.log('Gemini API key set. AI comments are now enabled!');
  }
}
