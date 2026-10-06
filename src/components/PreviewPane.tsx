type PreviewPaneProps = {
  html: string;
};

export default function PreviewPane({ html }: PreviewPaneProps) {
  return (
    <section className="app-pane">
      {/* Safe: `html` always comes from renderMarkdown, which sanitizes via DOMPurify. */}
      <div className="preview-body" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
