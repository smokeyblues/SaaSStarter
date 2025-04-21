<!-- src/lib/components/RichTextEditor.svelte -->
<script lang="ts">
  import { Editor } from "@tiptap/core"
  import StarterKit from "@tiptap/starter-kit"
  import Placeholder from "@tiptap/extension-placeholder"
  import { onMount, tick } from "svelte" // Import tick
  import type { EditorEvents } from "@tiptap/core"

  let {
    value = "", // Initial HTML content
    name, // Name for the hidden input
    placeholder = "Enter text...",
    onBlur, // Optional callback when editor loses focus
  }: {
    value?: string
    name: string
    placeholder?: string
    onBlur?: (html: string) => void
  } = $props()

  let editorElement: HTMLDivElement | undefined = $state()
  let editor: Editor | undefined = $state()
  let hiddenInputValue = $state(value) // Local state for hidden input, initialized with prop
  let isEditable = $state(false) // Track if editor is ready and editable

  // Initialize TipTap Editor
  onMount(() => {
    // Ensure the element is mounted before proceeding
    // await tick()

    if (!editorElement) {
      console.error("RichTextEditor: editorElement not found on mount.")
      return
    }

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit, // Basic formatting (bold, italic, paragraphs, etc.)
        Placeholder.configure({ placeholder }),
      ],
      // IMPORTANT: Start with initial content but ensure it's editable
      content: value,
      editable: true, // Explicitly set editable
      editorProps: {
        attributes: {
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-3 border border-base-300 rounded-md min-h-[150px] bg-base-100",
        },
      },
      // Update hidden input on changes
      onUpdate: ({ editor: updatedEditor }: EditorEvents["update"]) => {
        hiddenInputValue = updatedEditor.getHTML()
      },
      // Optionally trigger external save on blur
      onBlur: ({ editor: blurredEditor }: EditorEvents["blur"]) => {
        const currentHTML = blurredEditor.getHTML()
        hiddenInputValue = currentHTML // Ensure hidden input is synced on blur too
        if (onBlur) {
          onBlur(currentHTML)
        }
      },
      // Track when editor becomes editable
      onCreate: () => {
        isEditable = true
      },
      onTransaction: () => {
        // Transactions happen on content change, selection change etc.
        // Check editable state here too if needed, though onCreate should suffice
        isEditable = editor?.isEditable ?? false
      },
    })

    // Ensure initial value is set for the hidden input
    hiddenInputValue = editor?.getHTML() ?? ""

    return () => {
      editor?.destroy() // Cleanup on unmount
      editor = undefined
    }
  })

  // Update editor if the value prop changes from outside
  $effect(() => {
    // Only update if editor exists, is mounted, and the external value differs from the internal state
    if (editor && editor.isMounted && value !== hiddenInputValue) {
      // Check if the editor's current content is actually different
      // This helps prevent resetting cursor position unnecessarily if value prop updates rapidly
      // but editor content hasn't actually changed from the external value yet.
      const editorHTML = editor.getHTML()
      if (value !== editorHTML) {
        console.log(
          "RTE: External value change detected, updating editor content.",
        )
        // Use 'false' to prevent triggering 'onUpdate' recursively
        editor.commands.setContent(value, false)
      }
      // Always ensure hidden input matches the incoming prop if we process this effect
      hiddenInputValue = value
    }
  })

  // Toolbar functions (remain the same)
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const setParagraph = () => editor?.chain().focus().setParagraph().run()
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run()
</script>

<div class="border border-base-300 rounded-md bg-base-100">
  <!-- Hidden Input for Form Submission -->
  <input type="hidden" {name} bind:value={hiddenInputValue} />

  <!-- Toolbar -->
  {#if editor}
    <div class="toolbar p-2 border-b border-base-300 flex flex-wrap gap-1">
      <!-- Disable toolbar if editor isn't editable -->
      <button
        type="button"
        onclick={toggleBold}
        disabled={!isEditable}
        class:btn-active={editor.isActive("bold")}
        class="btn btn-xs btn-ghost"
        aria-label="Bold">B</button
      >
      <button
        type="button"
        onclick={toggleItalic}
        disabled={!isEditable}
        class:btn-active={editor.isActive("italic")}
        class="btn btn-xs btn-ghost"
        aria-label="Italic">I</button
      >
      <button
        type="button"
        onclick={setParagraph}
        disabled={!isEditable}
        class:btn-active={editor.isActive("paragraph")}
        class="btn btn-xs btn-ghost"
        aria-label="Paragraph">P</button
      >
      <button
        type="button"
        onclick={toggleBulletList}
        disabled={!isEditable}
        class:btn-active={editor.isActive("bulletList")}
        class="btn btn-xs btn-ghost"
        aria-label="Bullet List">•</button
      >
      <button
        type="button"
        onclick={toggleOrderedList}
        disabled={!isEditable}
        class:btn-active={editor.isActive("orderedList")}
        class="btn btn-xs btn-ghost"
        aria-label="Numbered List">1.</button
      >
      <!-- Add more buttons here -->
    </div>
  {/if}

  <!-- TipTap Editor Mount Point -->
  <!-- Add a key based on value if frequent external changes cause issues (forces re-render) -->
  {#key value}
    <div bind:this={editorElement}></div>
  {/key}

  {#if !editor && !editorElement}
    <p class="p-3 text-sm text-base-content/50">Loading Editor...</p>
  {:else if editor && !isEditable}
    <p class="p-3 text-sm text-base-content/50">Editor initializing...</p>
  {/if}
</div>

<style>
  /* Target TipTap classes if needed, e.g., placeholder */
  :global(.tiptap p.is-editor-empty:first-child::before) {
    color: hsl(var(--bc) / 0.4);
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
  /* Style active toolbar buttons */
  .toolbar .btn-active {
    background-color: hsl(var(--b3)); /* Or primary color */
    color: hsl(var(--pc)); /* Ensure contrast */
  }
  .toolbar button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
