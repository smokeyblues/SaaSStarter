<!-- src/lib/components/RichTextEditor.svelte -->
<script lang="ts">
  import { Editor } from "@tiptap/core"
  import StarterKit from "@tiptap/starter-kit"
  import Placeholder from "@tiptap/extension-placeholder"
  import { onMount } from "svelte"
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
  let hiddenInputValue = $state(value) // Local state for hidden input

  // Initialize TipTap Editor
  onMount(() => {
    if (!editorElement) return

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit, // Basic formatting (bold, italic, paragraphs, etc.)
        Placeholder.configure({ placeholder }),
      ],
      content: value, // Set initial content
      editorProps: {
        attributes: {
          // Add Tailwind/DaisyUI classes for styling the editable area
          class:
            "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none p-3 border border-base-300 rounded-md min-h-[150px] bg-base-100",
        },
      },
      // Update hidden input on changes (or use onBlur)
      onUpdate: ({ editor: updatedEditor }: EditorEvents["update"]) => {
        hiddenInputValue = updatedEditor.getHTML()
      },
      // Optionally trigger external save on blur
      onBlur: ({ editor: blurredEditor }: EditorEvents["blur"]) => {
        const currentHTML = blurredEditor.getHTML()
        hiddenInputValue = currentHTML
        if (onBlur) {
          onBlur(currentHTML)
        }
      },
    })

    // Update hidden input initially
    hiddenInputValue = editor?.getHTML() ?? ""

    return () => {
      editor?.destroy() // Cleanup on unmount
    }
  })

  // Update editor if the value prop changes from outside
  $effect(() => {
    if (editor && value !== hiddenInputValue) {
      // Avoid recursive updates if change originated from editor
      editor.commands.setContent(value, false) // false = don't emit update event
      hiddenInputValue = value // Sync hidden input too
    }
  })

  // Toolbar functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const setParagraph = () => editor?.chain().focus().setParagraph().run()
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run()
  // Add more functions as needed (heading, blockquote, etc.)
</script>

<div class="border border-base-300 rounded-md bg-base-100">
  <!-- Hidden Input for Form Submission -->
  <input type="hidden" {name} bind:value={hiddenInputValue} />

  <!-- Toolbar -->
  {#if editor}
    <div class="toolbar p-2 border-b border-base-300 flex flex-wrap gap-1">
      <button
        type="button"
        onclick={toggleBold}
        class:btn-active={editor.isActive("bold")}
        class="btn btn-xs btn-ghost"
        aria-label="Bold">B</button
      >
      <button
        type="button"
        onclick={toggleItalic}
        class:btn-active={editor.isActive("italic")}
        class="btn btn-xs btn-ghost"
        aria-label="Italic">I</button
      >
      <button
        type="button"
        onclick={setParagraph}
        class:btn-active={editor.isActive("paragraph")}
        class="btn btn-xs btn-ghost"
        aria-label="Paragraph">P</button
      >
      <button
        type="button"
        onclick={toggleBulletList}
        class:btn-active={editor.isActive("bulletList")}
        class="btn btn-xs btn-ghost"
        aria-label="Bullet List">•</button
      >
      <button
        type="button"
        onclick={toggleOrderedList}
        class:btn-active={editor.isActive("orderedList")}
        class="btn btn-xs btn-ghost"
        aria-label="Numbered List">1.</button
      >
      <!-- Add more buttons here -->
    </div>
  {/if}

  <!-- TipTap Editor Mount Point -->
  <div bind:this={editorElement}></div>
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
</style>
