<!-- src/lib/components/RichTextEditor.svelte -->
<script lang="ts">
  import { Editor } from "@tiptap/core"
  import StarterKit from "@tiptap/starter-kit"
  import Placeholder from "@tiptap/extension-placeholder"
  import Paragraph from "@tiptap/extension-paragraph"
  import Underline from "@tiptap/extension-underline"
  import Link from "@tiptap/extension-link"
  import Image from "@tiptap/extension-image"
  import Strike from "@tiptap/extension-strike"
  import { onMount } from "svelte"
  import type { EditorEvents } from "@tiptap/core"

  let {
    value = $bindable(""), // Initial HTML content, now bindable
    name, // Name for the hidden input
    placeholder = "Enter text...",
    onBlur, // Optional callback when editor loses focus
  }: {
    value?: string
    name: string
    placeholder?: string
    onBlur?: (html: string) => void
  } = $props()

  // svelte-ignore non_reactive_update
  let editorElement: HTMLDivElement | undefined
  let editor: Editor | undefined = $state()
  let hiddenInputValue = $state(value) // Local state for hidden input, initialized with prop
  let isEditable = $state(false) // Track if editor is ready and editable
  let currentFontSize = $state("16") // Default font size
  let isUpdatingFromEditor = false // Prevent feedback loop

  // Initialize TipTap Editor
  onMount(() => {
    // setTimeout(() => {
    //   console.log(
    //     "[RichTextEditor] editorElement present?",
    //     !!editorElement,
    //     editorElement,
    //   )
    // }, 100)
    if (!editorElement) {
      console.error("RichTextEditor: editorElement not found on mount.")
      return
    }

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit, // Basic formatting (bold, italic, paragraphs, etc.)
        Placeholder.configure({ placeholder }),
        Underline,
        Link,
        Image,
      ],
      // IMPORTANT: Start with initial content but ensure it's editable
      content: value,
      editable: true, // Explicitly set editable
      editorProps: {
        attributes: {
          class: "tiptap prose min-h-[120px] max-w-none focus:outline-none",
        },
      },
      onUpdate: ({ editor }) => {
        isUpdatingFromEditor = true
        hiddenInputValue = editor.getHTML()
        isUpdatingFromEditor = false
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

    // Autofocus the editor after mount
    setTimeout(() => {
      if (editor) {
        editor.commands.focus()
        // console.log("Tiptap focus called", document.activeElement);
      }
    }, 0)

    return () => {
      editor?.destroy() // Cleanup on unmount
      editor = undefined
    }
  })

  // Update editor if the value prop changes from outside
  $effect(() => {
    if (editor && value !== editor.getHTML() && !isUpdatingFromEditor) {
      console.log(
        "RTE: External value change detected, updating editor content.",
      )
      editor.commands.setContent(value)
    }
  })

  // Toolbar functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run()
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
  const setParagraph = () => editor?.chain().focus().setParagraph().run()
  // const toggleHeading = () =>
  //   editor?.chain().focus().toggleHeading({ level: 1 }).run()
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run()
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run()
  const setLink = () => {
    const previousUrl = editor?.getAttributes("link").href || ""
    const url = window.prompt("Enter link URL", previousUrl)
    if (url !== null && url !== undefined && url !== "") {
      editor
        ?.chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run()
    }
  }
  const insertImage = () => {
    const url = window.prompt("Enter image URL")
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }
  // Font size handler
  function setFontSize(fontSize: string) {
    currentFontSize = fontSize
    // Update the editor root node style
    if (editor) {
      const root = editor.view.dom as HTMLElement
      if (root) {
        root.style.fontSize = fontSize + "px"
      }
    }
  }
</script>

<div class="bg-base-100 border border-base-300 rounded-xl shadow-sm">
  <!-- Hidden Input for Form Submission -->
  <input type="hidden" {name} bind:value={hiddenInputValue} />

  <!-- Toolbar -->
  {#if editor}
    <div
      class="flex flex-wrap items-center gap-2 px-4 py-2 bg-base-200 rounded-t-xl border-b border-base-300"
    >
      <!-- Font size dropdown -->
      <select
        class="select select-xs font-semibold mr-2 w-auto min-w-[3rem]"
        onchange={(e) => setFontSize((e.target as HTMLSelectElement).value)}
        aria-label="Font Size"
        disabled={!isEditable}
        bind:value={currentFontSize}
        tabindex="-1"
      >
        <option value="14">14</option>
        <option value="16">16</option>
        <option value="18">18</option>
        <option value="24">24</option>
        <option value="32">32</option>
      </select>
      <!-- Bold -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Bold"
        tabindex="-1"
        onclick={toggleBold}
        disabled={!isEditable}
        class:btn-active={editor.isActive("bold")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            d="M8 11H12.5C13.8807 11 15 9.88071 15 8.5C15 7.11929 13.8807 6 12.5 6H8V11ZM18 15.5C18 17.9853 15.9853 20 13.5 20H6V4H12.5C14.9853 4 17 6.01472 17 8.5C17 9.70431 16.5269 10.7981 15.7564 11.6058C17.0979 12.3847 18 13.837 18 15.5ZM8 13V18H13.5C14.8807 18 16 16.8807 16 15.5C16 14.1193 14.8807 13 13.5 13H8Z"
          ></path></svg
        >
      </button>
      <!-- Italic -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Italic"
        tabindex="-1"
        onclick={toggleItalic}
        disabled={!isEditable}
        class:btn-active={editor.isActive("italic")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 20H7V18H9.92661L12.0425 6H9V4H17V6H14.0734L11.9575 18H15V20Z"
          /></svg
        >
      </button>
      <!-- Underline -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Underline"
        tabindex="-1"
        onclick={toggleUnderline}
        disabled={!isEditable}
        class:btn-active={editor.isActive("underline")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 3V12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12V3H18V12C18 15.3137 15.3137 18 12 18C8.68629 18 6 15.3137 6 12V3H8ZM4 20H20V22H4V20Z"
          /></svg
        >
      </button>
      <!-- Strikethrough -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Strikethrough"
        tabindex="-1"
        onclick={toggleStrike}
        disabled={!isEditable}
        class:btn-active={editor.isActive("strike")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17.1538 14C17.3846 14.5161 17.5 15.0893 17.5 15.7196C17.5 17.0625 16.9762 18.1116 15.9286 18.867C14.8809 19.6223 13.4335 20 11.5862 20C9.94674 20 8.32335 19.6185 6.71592 18.8555V16.6009C8.23538 17.4783 9.7908 17.917 11.3822 17.917C13.9333 17.917 15.2128 17.1846 15.2208 15.7196C15.2208 15.0939 15.0049 14.5598 14.5731 14.1173C14.5339 14.0772 14.4939 14.0381 14.4531 14H3V12H21V14H17.1538ZM13.076 11H7.62908C7.4566 10.8433 7.29616 10.6692 7.14776 10.4778C6.71592 9.92084 6.5 9.24559 6.5 8.45207C6.5 7.21602 6.96583 6.165 7.89749 5.299C8.82916 4.43299 10.2706 4 12.2219 4C13.6934 4 15.1009 4.32808 16.4444 4.98426V7.13591C15.2448 6.44921 13.9293 6.10587 12.4978 6.10587C10.0187 6.10587 8.77917 6.88793 8.77917 8.45207C8.77917 8.87172 8.99709 9.23796 9.43293 9.55079C9.86878 9.86362 10.4066 10.1135 11.0463 10.3004C11.6665 10.4816 12.3431 10.7148 13.076 11H13.076Z"
          /></svg
        >
      </button>
      <!-- Bullet List -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Bullet List"
        tabindex="-1"
        onclick={toggleBulletList}
        disabled={!isEditable}
        class:btn-active={editor.isActive("bulletList")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><circle cx="6" cy="12" r="2" /><path
            d="M8 4H21V6H8V4ZM4.5 6.5C3.67157 6.5 3 5.82843 3 5C3 4.17157 3.67157 3.5 4.5 3.5C5.32843 3.5 6 4.17157 6 5C6 5.82843 5.32843 6.5 4.5 6.5ZM4.5 13.5C3.67157 13.5 3 12.8284 3 12C3 11.1716 3.67157 10.5 4.5 10.5C5.32843 10.5 6 11.1716 6 12C6 12.8284 5.32843 13.5 4.5 13.5ZM4.5 20.4C3.67157 20.4 3 19.7284 3 18.9C3 18.0716 3.67157 17.4 4.5 17.4C5.32843 17.4 6 18.0716 6 18.9C6 19.7284 5.32843 20.4 4.5 20.4ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z"
          /></svg
        >
      </button>
      <!-- Numbered List -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Numbered List"
        tabindex="-1"
        onclick={toggleOrderedList}
        disabled={!isEditable}
        class:btn-active={editor.isActive("orderedList")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><text x="3" y="17" font-size="12">1.</text><path
            d="M5.75024 3.5H4.71733L3.25 3.89317V5.44582L4.25002 5.17782L4.25018 8.5H3V10H7V8.5H5.75024V3.5ZM10 4H21V6H10V4ZM10 11H21V13H10V11ZM10 18H21V20H10V18ZM2.875 15.625C2.875 14.4514 3.82639 13.5 5 13.5C6.17361 13.5 7.125 14.4514 7.125 15.625C7.125 16.1106 6.96183 16.5587 6.68747 16.9167L6.68271 16.9229L5.31587 18.5H7V20H3.00012L2.99959 18.8786L5.4717 16.035C5.5673 15.9252 5.625 15.7821 5.625 15.625C5.625 15.2798 5.34518 15 5 15C4.67378 15 4.40573 15.2501 4.37747 15.5688L4.3651 15.875H2.875V15.625Z"
          /></svg
        >
      </button>
      <!-- Link -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Link"
        tabindex="-1"
        onclick={setLink}
        disabled={!isEditable}
        class:btn-active={editor.isActive("link")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.3638 15.5355L16.9496 14.1213L18.3638 12.7071C20.3164 10.7545 20.3164 7.58866 18.3638 5.63604C16.4112 3.68341 13.2453 3.68341 11.2927 5.63604L9.87849 7.05025L8.46428 5.63604L9.87849 4.22182C12.6122 1.48815 17.0443 1.48815 19.778 4.22182C22.5117 6.95549 22.5117 11.3876 19.778 14.1213L18.3638 15.5355ZM15.5353 18.364L14.1211 19.7782C11.3875 22.5118 6.95531 22.5118 4.22164 19.7782C1.48797 17.0445 1.48797 12.6123 4.22164 9.87868L5.63585 8.46446L7.05007 9.87868L5.63585 11.2929C3.68323 13.2455 3.68323 16.4113 5.63585 18.364C7.58847 20.3166 10.7543 20.3166 12.7069 18.364L14.1211 16.9497L15.5353 18.364ZM14.8282 7.75736L16.2425 9.17157L9.17139 16.2426L7.75717 14.8284L14.8282 7.75736Z"
          /></svg
        >
      </button>
      <!-- Image -->
      <button
        type="button"
        class="btn btn-xs btn-ghost"
        aria-label="Image"
        tabindex="-1"
        onclick={insertImage}
        disabled={!isEditable}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          ><rect x="3" y="3" width="18" height="18" rx="2" /><circle
            cx="8.5"
            cy="8.5"
            r="1.5"
          /><path
            d="M2.9918 21C2.44405 21 2 20.5551 2 20.0066V3.9934C2 3.44476 2.45531 3 2.9918 3H21.0082C21.556 3 22 3.44495 22 3.9934V20.0066C22 20.5552 21.5447 21 21.0082 21H2.9918ZM20 15V5H4V19L14 9L20 15ZM20 17.8284L14 11.8284L6.82843 19H20V17.8284ZM8 11C6.89543 11 6 10.1046 6 9C6 7.89543 6.89543 7 8 7C9.10457 7 10 7.89543 10 9C10 10.1046 9.10457 11 8 11Z"
          /></svg
        >
      </button>
    </div>
  {/if}

  <!-- Editor area -->
  <div class="px-4 pb-4 pt-3">
    <div bind:this={editorElement}></div>
    {#if !editor && !editorElement}
      <p class="p-3 text-sm text-base-content/50">Loading Editor...</p>
    {:else if editor && !isEditable}
      <p class="p-3 text-sm text-base-content/50">Editor initializing...</p>
    {/if}
  </div>
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
</style>
