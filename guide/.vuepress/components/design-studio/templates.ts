import type { BuilderBlock, BuilderDocument, BuilderMode, LibraryItem } from './types';

const makeId = () => Math.random().toString(36).slice(2, 10);

export const modeLabels: Record<BuilderMode, { title: string; helper: string }> = {
  embed: {
    title: 'Classic embed',
    helper: 'Build a familiar Discord embed with text, images, fields, and quick actions.',
  },
  components: {
    title: 'Components message',
    helper: 'Build a message layout with rows, text blocks, buttons, dropdowns, and richer sections.',
  },
};

export const libraryByMode: Record<BuilderMode, LibraryItem[]> = {
  embed: [
    { type: 'title', label: 'Title', helper: 'Short headline for the top of your message.' },
    { type: 'description', label: 'Description', helper: 'Main text area for your message.' },
    { type: 'color', label: 'Color', helper: 'Pick the side color for the embed.' },
    { type: 'author', label: 'Author', helper: 'Show who this message comes from.' },
    { type: 'thumbnail', label: 'Thumbnail', helper: 'Small image in the top corner.' },
    { type: 'image', label: 'Image', helper: 'Large image shown under the text.' },
    { type: 'field', label: 'Field', helper: 'Add a small info box with a label and value.' },
    { type: 'footer', label: 'Footer', helper: 'Helpful note shown at the bottom.' },
    { type: 'timestamp', label: 'Timestamp', helper: 'Show the current date and time.' },
    { type: 'button', label: 'Button', helper: 'Give people a clear action to click.' },
    { type: 'select', label: 'Dropdown', helper: 'Let people choose from a short list.' },
  ],
  components: [
    { type: 'container', label: 'Box', helper: 'A main box that groups related blocks together.' },
    { type: 'section', label: 'Row', helper: 'A row for text, buttons, or media.' },
    { type: 'text', label: 'Text', helper: 'Add a short note, heading, or explanation.' },
    { type: 'separator', label: 'Divider', helper: 'Split parts of the message with a simple line.' },
    { type: 'gallery', label: 'Image', helper: 'Show one or more image links in a gallery.' },
    { type: 'file', label: 'File', helper: 'Attach a file link with a short note.' },
    { type: 'button', label: 'Button', helper: 'Send people to a link or action.' },
    { type: 'select', label: 'Dropdown', helper: 'Give people a list to choose from.' },
    { type: 'action-row', label: 'Button row', helper: 'Keep several buttons together in one row.' },
  ],
};

export function createBlock(type: LibraryItem['type']): BuilderBlock {
  const base = {
    id: makeId(),
    collapsed: false,
    children: [] as BuilderBlock[],
  };

  switch (type) {
    case 'title':
      return { ...base, type, label: 'Title', helper: 'Add a short headline here.', settings: { text: 'Welcome to Archivist Plus' } };
    case 'description':
      return { ...base, type, label: 'Description', helper: 'Add the main message text here.', settings: { text: 'Give people a friendly overview of what this message is for.' } };
    case 'color':
      return { ...base, type, label: 'Color', helper: 'Choose the left accent color.', settings: { color: '#5865F2' } };
    case 'author':
      return { ...base, type, label: 'Author', helper: 'Show a small name and icon at the top.', settings: { name: 'Archivist Plus', icon: 'https://cdn.discordapp.com/embed/avatars/0.png' } };
    case 'thumbnail':
      return { ...base, type, label: 'Thumbnail', helper: 'Small image shown in the corner.', settings: { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80' } };
    case 'image':
      return { ...base, type, label: 'Image', helper: 'Large image shown below the text.', settings: { url: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80' } };
    case 'field':
      return { ...base, type, label: 'Field', helper: 'Small label and value pair.', settings: { name: 'Why this matters', value: 'Show key details in a neat two-column style.', inline: false } };
    case 'footer':
      return { ...base, type, label: 'Footer', helper: 'Small note at the bottom.', settings: { text: 'Sent from the Design Studio', icon: 'https://cdn.discordapp.com/embed/avatars/4.png' } };
    case 'timestamp':
      return { ...base, type, label: 'Timestamp', helper: 'Show today\'s date and time.', settings: { enabled: true } };
    case 'button':
      return { ...base, type, label: 'Button', helper: 'A clickable action for your message.', settings: { text: 'Open dashboard', style: 'Primary', url: 'https://example.com' } };
    case 'select':
      return {
        ...base,
        type,
        label: 'Dropdown',
        helper: 'Let people choose from a list.',
        settings: {
          placeholder: 'Choose an option',
          options: [
            { id: makeId(), label: 'Option one', value: 'option_one', note: 'Helpful first choice' },
            { id: makeId(), label: 'Option two', value: 'option_two', note: 'Helpful second choice' },
          ],
        },
      };
    case 'container':
      return { ...base, type, label: 'Box', helper: 'Group blocks together inside a message box.', settings: { title: 'Main box' } };
    case 'section':
      return { ...base, type, label: 'Row', helper: 'A simple row for related items.', settings: { title: 'Row title' } };
    case 'separator':
      return { ...base, type, label: 'Divider', helper: 'Separate parts of your message.', settings: { spacing: 'normal' } };
    case 'text':
      return { ...base, type, label: 'Text', helper: 'Add a heading or short message.', settings: { text: 'Say something helpful here.' } };
    case 'gallery':
      return { ...base, type, label: 'Image', helper: 'Show one or more image links.', settings: { images: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80'] } };
    case 'file':
      return { ...base, type, label: 'File', helper: 'Share a file link with a note.', settings: { title: 'Rules PDF', url: 'https://example.com/rules.pdf' } };
    case 'action-row':
      return { ...base, type, label: 'Button row', helper: 'Keep a few actions together.', settings: { title: 'Actions' }, children: [createBlock('button')] };
  }
}

export const starterDocuments: BuilderDocument[] = [
  {
    id: 'verify-panel',
    name: 'Verify panel',
    mode: 'embed',
    summary: 'A simple verification message with one clear action.',
    blocks: [
      { ...createBlock('title'), settings: { text: 'Verify to unlock the server' } },
      { ...createBlock('description'), settings: { text: 'Tap the button below to prove you are human and open the rest of the server.' } },
      { ...createBlock('color'), settings: { color: '#57F287' } },
      { ...createBlock('button'), settings: { text: 'Verify now', style: 'Success', url: 'https://example.com/verify' } },
      { ...createBlock('footer'), settings: { text: 'Need help? Ask a moderator.' } },
    ],
  },
  {
    id: 'rules-panel',
    name: 'Rules panel',
    mode: 'components',
    summary: 'A friendly rules overview with clear sections and actions.',
    blocks: [
      { ...createBlock('container'), settings: { title: 'Server rules' } },
      { ...createBlock('text'), settings: { text: 'Please read these quick rules before you start chatting.' } },
      { ...createBlock('separator') },
      { ...createBlock('section'), settings: { title: 'Be respectful' } },
      { ...createBlock('text'), settings: { text: 'Treat people kindly, avoid spam, and keep things safe for everyone.' } },
      { ...createBlock('action-row'), children: [
        { ...createBlock('button'), settings: { text: 'Read full rules', style: 'Secondary', url: 'https://example.com/rules' } },
        { ...createBlock('button'), settings: { text: 'Ask a mod', style: 'Primary', url: 'https://example.com/help' } },
      ] },
    ],
  },
  {
    id: 'welcome-panel',
    name: 'Welcome panel',
    mode: 'embed',
    summary: 'A warm welcome card with quick next steps.',
    blocks: [
      { ...createBlock('author'), settings: { name: 'Archivist Plus', icon: 'https://cdn.discordapp.com/embed/avatars/1.png' } },
      { ...createBlock('title'), settings: { text: 'Welcome to the community!' } },
      { ...createBlock('description'), settings: { text: 'We are glad you are here. Start by reading the rules, picking your roles, and saying hello.' } },
      { ...createBlock('field'), settings: { name: 'Start here', value: 'Read the rules\nPick your roles\nIntroduce yourself', inline: true } },
      { ...createBlock('image') },
      { ...createBlock('button'), settings: { text: 'Pick roles', style: 'Primary', url: 'https://example.com/roles' } },
    ],
  },
];

export function cloneDocument(document: BuilderDocument): BuilderDocument {
  return JSON.parse(JSON.stringify(document));
}
