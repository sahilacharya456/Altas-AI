import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>AltasAI</title>
        <ScrollViewStyleReset />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function showError(msg) {
                var errDiv = document.createElement('div');
                errDiv.style.color = 'white';
                errDiv.style.backgroundColor = 'red';
                errDiv.style.padding = '20px';
                errDiv.style.position = 'absolute';
                errDiv.style.top = '0';
                errDiv.style.left = '0';
                errDiv.style.zIndex = '9999';
                errDiv.innerHTML = '<h2>Error Caught</h2><p>' + msg + '</p>';
                document.body.appendChild(errDiv);
              }
              window.onerror = function(msg, url, line, col, error) {
                showError(msg + '<br>' + (error ? error.stack : ''));
              };
              window.addEventListener('unhandledrejection', function(event) {
                showError('Unhandled Promise Rejection: ' + (event.reason ? event.reason.stack || event.reason : 'Unknown'));
              });
              var oldError = console.error;
              console.error = function() {
                showError('console.error: ' + Array.from(arguments).join(' '));
                oldError.apply(console, arguments);
              };
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
