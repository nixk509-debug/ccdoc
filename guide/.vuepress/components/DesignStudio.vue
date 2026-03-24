<template>
  <section class="studio-shell">
    <header class="studio-topbar">
      <div>
        <p class="eyebrow">Design Studio</p>
        <h1>Build Discord messages the easy way</h1>
        <p class="topbar-copy">Pick a message type, add blocks, and keep one eye on the live preview the whole time.</p>
      </div>
      <div class="topbar-actions">
        <button v-for="tab in modeTabs" :key="tab.mode" class="pill-button" :class="{ active: state.mode === tab.mode }" @click="switchMode(tab.mode)">{{ tab.label }}</button>
      </div>
    </header>

    <section class="plan-card">
      <div>
        <strong>Architecture plan</strong>
        <p>{{ modeMeta.helper }}</p>
      </div>
      <ol>
        <li>Pick a starting template.</li>
        <li>Add blocks to the page or inside a box.</li>
        <li>Edit the selected block on the right.</li>
        <li>Fix any friendly checks, then export or publish.</li>
      </ol>
    </section>

    <div class="quick-summary">
      <div>
        <strong>{{ state.document.name }}</strong>
        <p>{{ state.document.summary }}</p>
      </div>
      <div class="status-chip" :class="readyState.className">{{ readyState.label }}</div>
    </div>

    <div class="toolbar">
      <button class="ghost-button" @click="undo" :disabled="!canUndo">Undo</button>
      <button class="ghost-button" @click="redo" :disabled="!canRedo">Redo</button>
      <button class="ghost-button" @click="showTemplates = !showTemplates">Templates</button>
      <button class="ghost-button" @click="showSaved = !showSaved">Saved drafts</button>
      <button class="ghost-button" @click="toggleJsonPanel">JSON</button>
      <button class="ghost-button" @click="saveDraft">Save</button>
      <button class="primary-button" @click="publishMessage">Publish</button>
    </div>

    <div v-if="showTemplates" class="template-strip">
      <button v-for="template in matchingTemplates" :key="template.id" class="template-card" @click="loadDocument(template)">
        <strong>{{ template.name }}</strong>
        <span>{{ template.summary }}</span>
      </button>
    </div>

    <div v-if="showSaved" class="template-strip">
      <button v-for="draft in savedDrafts" :key="draft.id" class="template-card" @click="loadSavedDraft(draft.id)">
        <strong>{{ draft.name }}</strong>
        <span>{{ draft.summary }}</span>
      </button>
      <div v-if="!savedDrafts.length" class="template-card muted"><strong>No saved drafts yet</strong><span>Save a draft on this device to see it here.</span></div>
    </div>

    <div class="mobile-tabs">
      <button v-for="panel in mobilePanels" :key="panel.key" class="pill-button" :class="{ active: mobilePanel === panel.key }" @click="mobilePanel = panel.key">{{ panel.label }}</button>
    </div>

    <div class="studio-grid">
      <aside class="studio-sidebar" :class="mobileVisibility('library')">
        <div class="panel-head">
          <h2>Add block</h2>
          <p>{{ selectedContainer ? `Add something inside ${selectedContainer.label.toLowerCase()}.` : 'Pick a piece to add to your message.' }}</p>
        </div>
        <div class="library-list">
          <button v-for="item in libraryItems" :key="item.type" class="library-card" :disabled="!canAddBlock(item.type)" @click="addBlock(item.type)">
            <strong>{{ item.label }}</strong>
            <span>{{ canAddBlock(item.type) ? item.helper : addLimitMessage(item.type) }}</span>
          </button>
        </div>
      </aside>

      <main class="studio-canvas" :class="mobileVisibility('canvas')">
        <div class="panel-head">
          <h2>Message layout</h2>
          <p>Click a block to edit it. Use rows and boxes to keep things easy to follow.</p>
        </div>

        <div class="document-field field">
          <span>Message name</span>
          <input :value="state.document.name" @input="updateDocument('name', ($event.target as HTMLInputElement).value)" />
          <small>Use a short name so you can spot this draft later.</small>
        </div>

        <div v-if="!state.document.blocks.length" class="empty-state">
          <h3>Start your message</h3>
          <p>Use the left side to add your first block.</p>
        </div>

        <div v-else class="canvas-list">
          <template v-for="(block, index) in state.document.blocks" :key="block.id">
            <article class="canvas-card" :class="{ selected: isSelected([index]) }">
              <div class="canvas-select" @click="selectPath([index])">
                <div>
                  <strong>{{ block.label }}</strong>
                  <p>{{ block.helper }}</p>
                </div>
                <span class="block-tag">{{ prettyType(block.type) }}</span>
              </div>
              <div v-if="!block.collapsed" class="canvas-card-body">
                <div class="mini-preview">{{ summarizeBlock(block) }}</div>
                <div v-if="validationByKey[pathKey([index])]?.length" class="inline-warning">{{ validationByKey[pathKey([index])][0] }}</div>
                <div v-if="supportsChildren(block)" class="child-tools">
                  <button class="ghost-button small" @click="selectPath([index])">Add inside this {{ block.type === 'action-row' ? 'row' : 'box' }}</button>
                  <span>{{ block.children?.length || 0 }} block{{ (block.children?.length || 0) === 1 ? '' : 's' }}</span>
                </div>
                <div v-if="block.children?.length" class="child-stack">
                  <template v-for="(child, childIndex) in block.children" :key="child.id">
                    <article class="canvas-card child" :class="{ selected: isSelected([index, childIndex]) }">
                      <div class="canvas-select" @click="selectPath([index, childIndex])">
                        <div>
                          <strong>{{ child.label }}</strong>
                          <p>{{ child.helper }}</p>
                        </div>
                        <span class="block-tag">{{ prettyType(child.type) }}</span>
                      </div>
                      <div class="canvas-card-body">
                        <div class="mini-preview">{{ summarizeBlock(child) }}</div>
                        <div v-if="validationByKey[pathKey([index, childIndex])]?.length" class="inline-warning">{{ validationByKey[pathKey([index, childIndex])][0] }}</div>
                      </div>
                      <div class="card-actions">
                        <button class="tiny-button" @click="moveBlock([index, childIndex], -1)">Up</button>
                        <button class="tiny-button" @click="moveBlock([index, childIndex], 1)">Down</button>
                        <button class="tiny-button" @click="duplicateBlock([index, childIndex])">Copy</button>
                        <button class="tiny-button danger" @click="removeBlock([index, childIndex])">Delete</button>
                      </div>
                    </article>
                  </template>
                </div>
              </div>
              <div class="card-actions">
                <button class="tiny-button" @click="moveBlock([index], -1)">Up</button>
                <button class="tiny-button" @click="moveBlock([index], 1)">Down</button>
                <button class="tiny-button" @click="duplicateBlock([index])">Copy</button>
                <button class="tiny-button" @click="toggleCollapse([index])">{{ block.collapsed ? 'Open' : 'Close' }}</button>
                <button class="tiny-button danger" @click="removeBlock([index])">Delete</button>
              </div>
            </article>
          </template>
        </div>
      </main>

      <aside class="studio-sidebar" :class="mobileVisibility('settings')">
        <div class="panel-head">
          <h2>Block settings</h2>
          <p v-if="selectedBlock">Change one thing at a time here.</p>
          <p v-else>Pick a block to see its settings.</p>
        </div>

        <div v-if="selectedBlock" class="settings-form">
          <div class="helper-card">
            <strong>{{ selectedBlock.label }}</strong>
            <p>{{ selectedBlock.helper }}</p>
          </div>

          <label class="field">
            <span>Block name</span>
            <input :value="selectedBlock.label" @input="updateSelectedTopLevel('label', ($event.target as HTMLInputElement).value)" />
            <small>Use a clear name so the layout stays easy to scan.</small>
          </label>

          <template v-for="field in editableFields(selectedBlock)" :key="field.key">
            <label v-if="field.kind === 'text' || field.kind === 'color'" class="field">
              <span>{{ field.label }}</span>
              <input :type="field.kind === 'color' ? 'color' : 'text'" :value="selectedBlock.settings[field.key]" @input="updateSelectedSetting(field.key, ($event.target as HTMLInputElement).value)" />
              <small>{{ field.helper }}</small>
            </label>
            <label v-else-if="field.kind === 'textarea'" class="field">
              <span>{{ field.label }}</span>
              <textarea rows="4" :value="selectedBlock.settings[field.key]" @input="updateSelectedSetting(field.key, ($event.target as HTMLTextAreaElement).value)" />
              <small>{{ field.helper }}</small>
            </label>
            <label v-else class="field">
              <span>{{ field.label }}</span>
              <select :value="String(selectedBlock.settings[field.key])" @change="updateSelectedSetting(field.key, ($event.target as HTMLSelectElement).value === 'true')">
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
              <small>{{ field.helper }}</small>
            </label>
          </template>

          <div v-if="selectedBlock.type === 'button'" class="field">
            <span>Button style</span>
            <div class="choice-row">
              <button v-for="style in buttonStyles" :key="style" class="choice-chip" :class="{ active: selectedBlock.settings.style === style }" @click="updateSelectedSetting('style', style)">{{ style }}</button>
            </div>
            <small>Pick the look that best matches the action.</small>
          </div>

          <div v-if="selectedBlock.type === 'select'" class="field">
            <span>Dropdown choices</span>
            <div class="option-list">
              <div v-for="(option, optionIndex) in selectedBlock.settings.options" :key="option.id" class="option-card">
                <input :value="option.label" placeholder="Choice label" @input="updateOption(optionIndex, 'label', ($event.target as HTMLInputElement).value)" />
                <input :value="option.value" placeholder="Saved value" @input="updateOption(optionIndex, 'value', ($event.target as HTMLInputElement).value)" />
                <input :value="option.note" placeholder="Short helper note" @input="updateOption(optionIndex, 'note', ($event.target as HTMLInputElement).value)" />
                <button class="tiny-button danger" @click="removeOption(optionIndex)">Remove</button>
              </div>
            </div>
            <button class="ghost-button" @click="addOption">Add choice</button>
            <small>Keep each choice short so it still reads well on a phone.</small>
          </div>

          <div v-if="selectedBlock.type === 'gallery'" class="field">
            <span>Image links</span>
            <textarea rows="4" :value="(selectedBlock.settings.images || []).join('\n')" @input="updateSelectedSetting('images', ($event.target as HTMLTextAreaElement).value.split('\n').map((item) => item.trim()).filter(Boolean))" />
            <small>Put one image link on each line.</small>
          </div>
        </div>
      </aside>
    </div>

    <section class="preview-panel">
      <div class="panel-head">
        <h2>Live preview</h2>
        <p>Your message updates right away so you can learn by seeing.</p>
      </div>
      <div class="discord-preview">
        <div class="discord-avatar">A+</div>
        <div class="discord-body">
          <div class="discord-meta"><strong>Archivist Plus</strong><span>Today at 9:41 PM</span></div>

          <div v-if="state.mode === 'embed'" class="embed-preview" :style="{ borderColor: previewEmbed.color }">
            <div class="embed-main">
              <div v-if="previewEmbed.authorName" class="embed-author"><img v-if="previewEmbed.authorIcon" :src="previewEmbed.authorIcon" alt="" /><span>{{ previewEmbed.authorName }}</span></div>
              <h3 v-if="previewEmbed.title">{{ previewEmbed.title }}</h3>
              <p v-if="previewEmbed.description">{{ previewEmbed.description }}</p>
              <div v-if="previewEmbed.fields.length" class="embed-fields">
                <div v-for="field in previewEmbed.fields" :key="field.name + field.value" class="embed-field" :class="{ inline: field.inline }"><strong>{{ field.name }}</strong><span>{{ field.value }}</span></div>
              </div>
              <img v-if="previewEmbed.image" class="embed-image" :src="previewEmbed.image" alt="" />
              <div v-if="previewEmbed.footerText || previewEmbed.timestamp" class="embed-footer"><img v-if="previewEmbed.footerIcon" :src="previewEmbed.footerIcon" alt="" /><span>{{ previewEmbed.footerText || 'Sent from Archivist Plus' }}</span><span v-if="previewEmbed.timestamp">• {{ previewEmbed.timestamp }}</span></div>
            </div>
            <img v-if="previewEmbed.thumbnail" class="embed-thumb" :src="previewEmbed.thumbnail" alt="" />
          </div>

          <div v-else class="components-preview">
            <div v-for="(item, index) in previewComponents" :key="index" class="component-block" :class="item.className">
              <strong v-if="item.title">{{ item.title }}</strong>
              <p v-if="item.text">{{ item.text }}</p>
              <div v-if="item.buttons?.length" class="preview-button-row">
                <button v-for="button in item.buttons" :key="button.text" class="preview-button" :class="button.style.toLowerCase()">{{ button.text }}</button>
              </div>
              <div v-if="item.options?.length" class="preview-dropdown">{{ item.placeholder }}</div>
              <div v-if="item.images?.length" class="preview-gallery"><img v-for="image in item.images" :key="image" :src="image" alt="" /></div>
              <a v-if="item.fileUrl" :href="item.fileUrl" class="preview-file">{{ item.fileTitle }}</a>
            </div>
          </div>

          <div class="message-actions" v-if="previewButtons.length || previewSelects.length">
            <button v-for="button in previewButtons" :key="button.text + button.url" class="preview-button" :class="button.style.toLowerCase()">{{ button.text }}</button>
            <div v-for="select in previewSelects" :key="select.placeholder" class="preview-dropdown">{{ select.placeholder }}</div>
          </div>
        </div>
      </div>
    </section>

    <section class="notes-grid">
      <article class="note-card">
        <h3>Friendly checks</h3>
        <ul><li v-for="message in validationMessages" :key="message">{{ message }}</li></ul>
      </article>
      <article class="note-card">
        <h3>What still needs work</h3>
        <ul>
          <li>True drag and drop</li>
          <li>Deeper nested editing for every block type</li>
          <li>Server-side saving and publishing</li>
        </ul>
      </article>
    </section>

    <div v-if="showJsonPanel" class="json-panel">
      <div class="json-card">
        <div class="panel-head">
          <h2>Import or export JSON</h2>
          <p>Copy your message out, or paste one in to keep editing.</p>
        </div>
        <textarea v-model="jsonDraft" rows="16" />
        <div class="toolbar">
          <button class="ghost-button" @click="fillJsonDraft">Refresh</button>
          <button class="ghost-button" @click="copyJson">Copy</button>
          <button class="primary-button" @click="importJson">Use this JSON</button>
          <button class="ghost-button" @click="showJsonPanel = false">Close</button>
        </div>
        <p class="json-message">{{ jsonMessage }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { cloneDocument, createBlock, libraryByMode, modeLabels, starterDocuments } from './design-studio/templates';
import { cloneBlocks, getBlockAtPath, insertBlockAtPath, moveBlockAtPath, removeBlockAtPath, walkBlocks } from './design-studio/tree';
import type { BlockType, BuilderBlock, BuilderDocument, BuilderMode } from './design-studio/types';

const storageKey = 'archivist-plus-design-studio';
const buttonStyles = ['Primary', 'Secondary', 'Success', 'Danger'];
const modeTabs = [
  { mode: 'embed', label: 'Classic embed' },
  { mode: 'components', label: 'Components message' },
] as const;
const mobilePanels = [
  { key: 'library', label: 'Blocks' },
  { key: 'canvas', label: 'Layout' },
  { key: 'settings', label: 'Settings' },
] as const;

const state = reactive({
  mode: 'embed' as BuilderMode,
  document: cloneDocument(starterDocuments[0]),
  selectedPath: [0] as number[],
});
const history = ref<BuilderDocument[]>([]);
const future = ref<BuilderDocument[]>([]);
const showTemplates = ref(false);
const showSaved = ref(false);
const showJsonPanel = ref(false);
const jsonDraft = ref('');
const jsonMessage = ref('');
const mobilePanel = ref<'library' | 'canvas' | 'settings'>('canvas');
const savedDrafts = ref<BuilderDocument[]>([]);

const modeMeta = computed(() => modeLabels[state.mode]);
const libraryItems = computed(() => libraryByMode[state.mode]);
const canUndo = computed(() => history.value.length > 0);
const canRedo = computed(() => future.value.length > 0);
const matchingTemplates = computed(() => starterDocuments.filter((item) => item.mode === state.mode));
const selectedBlock = computed(() => getBlockAtPath(state.document.blocks, state.selectedPath));
const selectedContainer = computed(() => selectedBlock.value && supportsChildren(selectedBlock.value) ? selectedBlock.value : undefined);

function supportsChildren(block: BuilderBlock) {
  return block.type === 'container' || block.type === 'section' || block.type === 'action-row';
}

function pathKey(path: number[]) {
  return path.join('.');
}

function prettyType(type: string) {
  return type.replace('-', ' ');
}

function snapshot() {
  history.value.push(cloneDocument(state.document));
  if (history.value.length > 50) history.value.shift();
  future.value = [];
}

function syncStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey, JSON.stringify({ mode: state.mode, document: state.document }));
}

function loadLocalState() {
  if (typeof window === 'undefined') return;
  const current = window.localStorage.getItem(storageKey);
  const drafts = window.localStorage.getItem(`${storageKey}:saved`);
  if (current) {
    try {
      const parsed = JSON.parse(current);
      state.mode = parsed.mode;
      state.document = parsed.document;
      state.selectedPath = [0];
    } catch {}
  }
  if (drafts) {
    try {
      savedDrafts.value = JSON.parse(drafts);
    } catch {}
  }
}

loadLocalState();

function withDocumentChange(mutator: () => void) {
  snapshot();
  mutator();
  syncStorage();
}

function updateDocument(key: 'name' | 'summary', value: string) {
  withDocumentChange(() => {
    state.document[key] = value;
  });
}

function selectPath(path: number[]) {
  state.selectedPath = [...path];
  mobilePanel.value = 'settings';
}

function isSelected(path: number[]) {
  return pathKey(path) === pathKey(state.selectedPath);
}

function canAddBlock(type: BlockType) {
  if (!selectedContainer.value) return true;
  if (selectedContainer.value.type === 'action-row') return type === 'button';
  if (selectedContainer.value.type === 'section') return ['text', 'button', 'select', 'separator', 'gallery', 'file'].includes(type);
  return !['title', 'description', 'color', 'author', 'thumbnail', 'image', 'field', 'footer', 'timestamp'].includes(type) || state.mode === 'embed';
}

function addLimitMessage(type: BlockType) {
  if (selectedContainer.value?.type === 'action-row') return 'This row can only hold buttons.';
  if (selectedContainer.value?.type === 'section') return 'This row works best with text, buttons, dropdowns, files, or images.';
  return `You cannot add ${prettyType(type)} here.`;
}

function addBlock(type: BlockType) {
  if (!canAddBlock(type)) return;
  withDocumentChange(() => {
    const block = createBlock(type);
    if (selectedContainer.value) {
      insertBlockAtPath(state.document.blocks, state.selectedPath, block, 'inside');
      const childIndex = (selectedContainer.value.children?.length || 1) - 1;
      state.selectedPath = [...state.selectedPath, childIndex];
      return;
    }
    state.document.blocks.push(block);
    state.selectedPath = [state.document.blocks.length - 1];
  });
}

function moveBlock(path: number[], direction: -1 | 1) {
  withDocumentChange(() => {
    moveBlockAtPath(state.document.blocks, path, direction);
  });
}

function duplicateBlock(path: number[]) {
  const block = getBlockAtPath(state.document.blocks, path);
  if (!block) return;
  withDocumentChange(() => {
    const copy = cloneBlocks(block);
    copy.id = Math.random().toString(36).slice(2, 10);
    insertBlockAtPath(state.document.blocks, path, copy, 'after');
  });
}

function removeBlock(path: number[]) {
  withDocumentChange(() => {
    removeBlockAtPath(state.document.blocks, path);
    state.selectedPath = [0];
  });
}

function toggleCollapse(path: number[]) {
  const block = getBlockAtPath(state.document.blocks, path);
  if (block) block.collapsed = !block.collapsed;
}

function updateSelectedSetting(key: string, value: any) {
  if (!selectedBlock.value) return;
  withDocumentChange(() => {
    const target = getBlockAtPath(state.document.blocks, state.selectedPath);
    if (target) target.settings[key] = value;
  });
}

function updateSelectedTopLevel(key: 'label', value: string) {
  if (!selectedBlock.value) return;
  withDocumentChange(() => {
    const target = getBlockAtPath(state.document.blocks, state.selectedPath);
    if (target) target[key] = value;
  });
}

function editableFields(block: BuilderBlock) {
  return {
    title: [{ key: 'text', label: 'Title text', helper: 'Keep it short and clear.', kind: 'text' }],
    description: [{ key: 'text', label: 'Main text', helper: 'Explain the message in simple words.', kind: 'textarea' }],
    color: [{ key: 'color', label: 'Accent color', helper: 'This color appears on the left edge.', kind: 'color' }],
    author: [{ key: 'name', label: 'Author name', helper: 'Who is this message from?', kind: 'text' }, { key: 'icon', label: 'Author icon link', helper: 'Paste an image link if you want one.', kind: 'text' }],
    thumbnail: [{ key: 'url', label: 'Thumbnail link', helper: 'Paste the image link to show.', kind: 'text' }],
    image: [{ key: 'url', label: 'Image link', helper: 'Paste the main image link here.', kind: 'text' }],
    field: [{ key: 'name', label: 'Field title', helper: 'The small heading people will see first.', kind: 'text' }, { key: 'value', label: 'Field text', helper: 'Add the detail you want to show.', kind: 'textarea' }, { key: 'inline', label: 'Keep this field compact?', helper: 'Choose yes to place fields side by side.', kind: 'toggle' }],
    footer: [{ key: 'text', label: 'Footer text', helper: 'A small closing note.', kind: 'text' }, { key: 'icon', label: 'Footer icon link', helper: 'Optional small image link.', kind: 'text' }],
    timestamp: [{ key: 'enabled', label: 'Show the time?', helper: 'Choose yes to add today\'s date.', kind: 'toggle' }],
    button: [{ key: 'text', label: 'Button text', helper: 'Use an action people will understand fast.', kind: 'text' }, { key: 'url', label: 'Click link', helper: 'Choose where people should go after clicking.', kind: 'text' }],
    select: [{ key: 'placeholder', label: 'Dropdown placeholder', helper: 'Show a helpful first prompt.', kind: 'text' }],
    container: [{ key: 'title', label: 'Box title', helper: 'Give this box a short name.', kind: 'text' }],
    section: [{ key: 'title', label: 'Row title', helper: 'Name the main point of this row.', kind: 'text' }],
    separator: [{ key: 'spacing', label: 'Divider spacing', helper: 'Use words like tight, normal, or roomy.', kind: 'text' }],
    text: [{ key: 'text', label: 'Text block', helper: 'Add a clear note or instruction.', kind: 'textarea' }],
    gallery: [],
    file: [{ key: 'title', label: 'File name', helper: 'Tell people what the file is.', kind: 'text' }, { key: 'url', label: 'File link', helper: 'Paste the file link here.', kind: 'text' }],
    'action-row': [{ key: 'title', label: 'Row title', helper: 'Optional helper name for this row.', kind: 'text' }],
  }[block.type] || [];
}

function summarizeBlock(block: BuilderBlock) {
  const directText = Object.values(block.settings).find((value) => typeof value === 'string' && value.trim());
  return directText || (block.children?.length ? `${block.children.length} child blocks` : 'Ready to edit');
}

function updateOption(index: number, key: string, value: string) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'select') return;
  withDocumentChange(() => {
    const target = getBlockAtPath(state.document.blocks, state.selectedPath);
    if (target?.type === 'select') target.settings.options[index][key] = value;
  });
}

function addOption() {
  if (!selectedBlock.value || selectedBlock.value.type !== 'select') return;
  withDocumentChange(() => {
    const target = getBlockAtPath(state.document.blocks, state.selectedPath);
    if (target?.type === 'select') target.settings.options.push({ id: Math.random().toString(36).slice(2, 10), label: 'New choice', value: 'new_choice', note: '' });
  });
}

function removeOption(index: number) {
  if (!selectedBlock.value || selectedBlock.value.type !== 'select') return;
  withDocumentChange(() => {
    const target = getBlockAtPath(state.document.blocks, state.selectedPath);
    if (target?.type === 'select') target.settings.options.splice(index, 1);
  });
}

function loadDocument(document: BuilderDocument) {
  withDocumentChange(() => {
    state.mode = document.mode;
    state.document = cloneDocument(document);
    state.selectedPath = [0];
    showTemplates.value = false;
  });
}

function loadSavedDraft(id: string) {
  const found = savedDrafts.value.find((draft) => draft.id === id);
  if (found) loadDocument(found);
}

function undo() {
  const previous = history.value.pop();
  if (!previous) return;
  future.value.unshift(cloneDocument(state.document));
  state.document = cloneDocument(previous);
  state.selectedPath = [0];
  syncStorage();
}

function redo() {
  const next = future.value.shift();
  if (!next) return;
  history.value.push(cloneDocument(state.document));
  state.document = cloneDocument(next);
  state.selectedPath = [0];
  syncStorage();
}

function switchMode(mode: BuilderMode) {
  if (state.mode === mode) return;
  const template = starterDocuments.find((item) => item.mode === mode) || starterDocuments[0];
  loadDocument(template);
}

const validationByKey = computed<Record<string, string[]>>(() => {
  const results: Record<string, string[]> = {};
  for (const item of walkBlocks(state.document.blocks)) {
    const block = item.block;
    const messages: string[] = [];
    if ((block.type === 'title' || block.type === 'description' || block.type === 'text') && !String(block.settings.text || '').trim()) messages.push('Add some text here first');
    if (block.type === 'button' && !String(block.settings.text || '').trim()) messages.push('Button text is missing');
    if (block.type === 'button' && !String(block.settings.url || '').trim()) messages.push('Choose what happens when clicked');
    if (block.type === 'select' && !(block.settings.options || []).length) messages.push('Add at least one choice first');
    if (block.type === 'field' && !String(block.settings.name || '').trim()) messages.push('Add a field title first');
    if (supportsChildren(block) && block.type !== 'action-row' && (block.children?.length || 0) === 0) messages.push('Add something inside this box first');
    if (block.type === 'action-row' && (block.children?.length || 0) === 0) messages.push('Pick a button for this row');
    if (block.type === 'action-row' && (block.children?.length || 0) > 5) messages.push('This area can only hold 5 buttons');
    if ((block.type === 'image' || block.type === 'thumbnail' || block.type === 'file') && !String(block.settings.url || '').trim()) messages.push('Add a link here first');
    if (messages.length) results[pathKey(item.path)] = messages;
  }
  return results;
});

const validationMessages = computed(() => {
  const list = Object.values(validationByKey.value).flat();
  return list.length ? list : ['This message is ready to publish'];
});

const readyState = computed(() => validationMessages.value[0] === 'This message is ready to publish'
  ? { label: 'Ready to publish', className: 'success' }
  : { label: `${validationMessages.value.length} thing${validationMessages.value.length === 1 ? '' : 's'} to fix`, className: 'warning' });

const previewEmbed = computed(() => {
  const data = { title: '', description: '', color: '#5865F2', authorName: '', authorIcon: '', thumbnail: '', image: '', footerText: '', footerIcon: '', timestamp: '', fields: [] as Array<{ name: string; value: string; inline: boolean }> };
  for (const block of state.document.blocks) {
    if (block.type === 'title') data.title = block.settings.text || '';
    if (block.type === 'description') data.description = block.settings.text || '';
    if (block.type === 'color') data.color = block.settings.color || '#5865F2';
    if (block.type === 'author') { data.authorName = block.settings.name || ''; data.authorIcon = block.settings.icon || ''; }
    if (block.type === 'thumbnail') data.thumbnail = block.settings.url || '';
    if (block.type === 'image') data.image = block.settings.url || '';
    if (block.type === 'field') data.fields.push({ name: block.settings.name || 'Field', value: block.settings.value || '', inline: !!block.settings.inline });
    if (block.type === 'footer') { data.footerText = block.settings.text || ''; data.footerIcon = block.settings.icon || ''; }
    if (block.type === 'timestamp' && block.settings.enabled) data.timestamp = new Date().toLocaleString();
  }
  return data;
});

function flattenComponentBlocks(blocks: BuilderBlock[]): BuilderBlock[] {
  return blocks.flatMap((block) => [block, ...(block.children?.length ? flattenComponentBlocks(block.children) : [])]);
}

const flatBlocks = computed(() => flattenComponentBlocks(state.document.blocks));
const previewButtons = computed(() => flatBlocks.value.filter((item) => item.type === 'button' && state.mode === 'embed').map((item) => ({ text: item.settings.text || 'Button', style: item.settings.style || 'Primary', url: item.settings.url || '#' })));
const previewSelects = computed(() => flatBlocks.value.filter((item) => item.type === 'select' && state.mode === 'embed').map((item) => ({ placeholder: item.settings.placeholder || 'Choose an option' })));
const previewComponents = computed(() => flatBlocks.value.filter((block) => state.mode === 'components').map((block) => {
  if (block.type === 'container') return { title: block.settings.title, className: 'box' };
  if (block.type === 'section') return { title: block.settings.title, className: 'row' };
  if (block.type === 'separator') return { text: '────────', className: 'divider' };
  if (block.type === 'text') return { text: block.settings.text, className: 'text' };
  if (block.type === 'gallery') return { title: 'Image gallery', images: block.settings.images || [], className: 'gallery' };
  if (block.type === 'file') return { fileTitle: block.settings.title, fileUrl: block.settings.url, className: 'file' };
  if (block.type === 'button') return { buttons: [{ text: block.settings.text || 'Button', style: block.settings.style || 'Primary' }], className: 'actions' };
  if (block.type === 'select') return { placeholder: block.settings.placeholder || 'Choose an option', options: block.settings.options || [], className: 'dropdown' };
  if (block.type === 'action-row') return { title: block.settings.title, buttons: (block.children || []).map((child) => ({ text: child.settings.text || 'Button', style: child.settings.style || 'Primary' })), className: 'actions' };
  return { text: summarizeBlock(block), className: 'text' };
}));

function fillJsonDraft() {
  jsonDraft.value = JSON.stringify({ mode: state.mode, document: state.document }, null, 2);
}

function toggleJsonPanel() {
  showJsonPanel.value = !showJsonPanel.value;
  if (showJsonPanel.value) fillJsonDraft();
}

async function copyJson() {
  fillJsonDraft();
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(jsonDraft.value);
    jsonMessage.value = 'JSON copied';
  } else {
    jsonMessage.value = 'Copy is not available here, but your JSON is ready.';
  }
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonDraft.value);
    if (!parsed.mode || !parsed.document?.blocks) throw new Error('Invalid');
    withDocumentChange(() => {
      state.mode = parsed.mode;
      state.document = parsed.document;
      state.selectedPath = [0];
    });
    jsonMessage.value = 'JSON loaded into the builder';
  } catch {
    jsonMessage.value = 'This JSON could not be used. Check the format and try again.';
  }
}

function saveDraft() {
  if (typeof window === 'undefined') return;
  const draft = { ...cloneDocument(state.document), id: `saved-${Date.now()}`, summary: 'Saved on this device for quick editing later.' };
  savedDrafts.value = [draft, ...savedDrafts.value].slice(0, 8);
  window.localStorage.setItem(`${storageKey}:saved`, JSON.stringify(savedDrafts.value));
  jsonMessage.value = 'Draft saved on this device';
}

function publishMessage() {
  jsonMessage.value = validationMessages.value[0] === 'This message is ready to publish' ? 'This message is ready to publish' : 'Fix the notes below before you publish';
}

function mobileVisibility(panel: 'library' | 'canvas' | 'settings') {
  return mobilePanel.value === panel ? 'mobile-visible' : 'mobile-hidden';
}
</script>

<style scoped>
:global(body) { background: #0b1020; }
.studio-shell { color: #edf2ff; display: grid; gap: 1rem; }
.studio-topbar, .plan-card, .quick-summary, .toolbar, .template-strip, .studio-sidebar, .studio-canvas, .preview-panel, .note-card, .json-card { background: linear-gradient(180deg, rgba(19,27,51,.95), rgba(11,16,32,.98)); border: 1px solid rgba(136,164,255,.18); border-radius: 20px; box-shadow: 0 18px 40px rgba(0,0,0,.28); }
.studio-topbar, .plan-card, .quick-summary, .preview-panel, .note-card, .json-card, .studio-sidebar, .studio-canvas { padding: 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: .12em; color: #9db1ff; font-size: .78rem; margin: 0 0 .35rem; }
h1,h2,h3,p,ol { margin: 0; }
.topbar-copy, .panel-head p, .quick-summary p, small, .json-message, .plan-card ol { color: #aeb9dd; }
.topbar-actions, .toolbar, .choice-row, .card-actions, .preview-button-row, .message-actions, .mobile-tabs, .child-tools { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
.plan-card { display: grid; gap: .75rem; grid-template-columns: 1.5fr 1fr; }
.plan-card ol { padding-left: 1rem; display: grid; gap: .25rem; }
.pill-button, .ghost-button, .primary-button, .tiny-button, .choice-chip, .library-card, .template-card { border: 1px solid rgba(136,164,255,.18); background: rgba(255,255,255,.04); color: #edf2ff; border-radius: 14px; padding: .75rem 1rem; cursor: pointer; }
.ghost-button.small { padding: .45rem .75rem; }
.primary-button { background: linear-gradient(135deg, #6a7cff, #8d61ff); border: none; }
.pill-button.active, .choice-chip.active { background: rgba(103,126,255,.28); }
.quick-summary, .discord-preview, .canvas-select { display: flex; justify-content: space-between; gap: 1rem; }
.status-chip { align-self: center; padding: .5rem .85rem; border-radius: 999px; font-weight: 700; }
.status-chip.success { background: rgba(87,242,135,.16); color: #82f5ac; }
.status-chip.warning { background: rgba(255,184,108,.16); color: #ffc678; }
.template-strip, .notes-grid, .studio-grid { display: grid; gap: 1rem; }
.template-strip { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); padding: 1rem; }
.template-card { text-align: left; display: grid; gap: .3rem; }
.template-card span { color: #aeb9dd; }
.template-card.muted { cursor: default; }
.studio-grid { grid-template-columns: 280px minmax(0, 1fr) 320px; align-items: start; }
.panel-head { display: grid; gap: .3rem; margin-bottom: 1rem; }
.library-list, .canvas-list, .settings-form, .option-list, .child-stack { display: grid; gap: .75rem; }
.canvas-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 16px; padding: .85rem; display: grid; gap: .75rem; }
.canvas-card.child { margin-left: 1rem; }
.canvas-card.selected { border-color: #6a7cff; box-shadow: inset 0 0 0 1px rgba(106,124,255,.5); }
.canvas-select { background: transparent; border: 0; color: inherit; padding: 0; text-align: left; cursor: pointer; align-items: start; }
.block-tag, .inline-warning, .preview-dropdown, .preview-file { background: rgba(255,255,255,.06); border-radius: 999px; padding: .3rem .65rem; font-size: .82rem; }
.inline-warning { background: rgba(255,184,108,.14); color: #ffc678; display: inline-flex; }
.field, .helper-card { display: grid; gap: .45rem; }
.helper-card { background: rgba(255,255,255,.04); border-radius: 14px; padding: .85rem; }
.field input, .field textarea, .field select, .json-card textarea { width: 100%; background: rgba(255,255,255,.05); border: 1px solid rgba(136,164,255,.15); border-radius: 14px; color: #edf2ff; padding: .85rem 1rem; }
.discord-preview { align-items: flex-start; background: #313338; border-radius: 18px; padding: 1rem; }
.discord-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #6a7cff, #8d61ff); display: grid; place-items: center; font-weight: 700; }
.discord-body { display: grid; gap: .85rem; width: 100%; }
.discord-meta { display: flex; gap: .75rem; align-items: center; }
.discord-meta span { color: #9ca3af; font-size: .82rem; }
.embed-preview { border-left: 4px solid #5865F2; background: #2b2d31; border-radius: 8px; padding: 1rem; display: flex; gap: 1rem; }
.embed-main { display: grid; gap: .7rem; flex: 1; }
.embed-author, .embed-footer { display: flex; gap: .5rem; align-items: center; color: #cbd5f5; font-size: .9rem; }
.embed-author img, .embed-footer img { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; }
.embed-fields { display: flex; flex-wrap: wrap; gap: .75rem; }
.embed-field { display: grid; gap: .3rem; width: 100%; }
.embed-field.inline { width: calc(50% - .375rem); }
.embed-image, .embed-thumb, .preview-gallery img { border-radius: 10px; object-fit: cover; }
.embed-image { width: 100%; max-height: 240px; }
.embed-thumb { width: 90px; height: 90px; }
.components-preview { display: grid; gap: .75rem; }
.component-block { background: #2b2d31; border: 1px solid rgba(255,255,255,.06); border-radius: 14px; padding: .85rem; display: grid; gap: .6rem; }
.component-block.divider { text-align: center; color: #7f8ab2; }
.preview-button { border: 0; border-radius: 10px; padding: .6rem .9rem; color: white; }
.preview-button.primary { background: #5865f2; }
.preview-button.secondary { background: #4e5058; }
.preview-button.success { background: #248046; }
.preview-button.danger { background: #da373c; }
.preview-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: .5rem; }
.preview-gallery img { width: 100%; height: 120px; }
.notes-grid { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.empty-state { border: 1px dashed rgba(136,164,255,.28); border-radius: 18px; padding: 2rem 1.2rem; text-align: center; display: grid; gap: .35rem; color: #aeb9dd; }
.json-panel { position: fixed; inset: 0; background: rgba(4,7,14,.82); display: grid; place-items: center; padding: 1rem; z-index: 30; }
.json-card { width: min(920px, 100%); }
.mobile-tabs { display: none; }
.tiny-button.danger { color: #ff9b9b; }
@media (max-width: 1100px) {
  .plan-card, .studio-grid { grid-template-columns: 1fr; }
  .mobile-tabs { display: flex; }
  .studio-sidebar, .studio-canvas { display: none; }
  .mobile-visible { display: block; }
  .mobile-hidden { display: none; }
}
@media (min-width: 1101px) {
  .mobile-visible, .mobile-hidden { display: block; }
}
</style>
