export const StateInspector = (state: any) => {
  return (
    <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>State Inspector</h3>
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {JSON.stringify(state, null, 2)}
        </pre>
    </div>
  );
}