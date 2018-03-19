var http = require( 'http' );
// var https = require( 'https' );
var url = require( 'url' );
var request = require( 'request' );


class NodeProxy
{
  constructor()
  {
    var jar = request.jar();
    let httpServer = http.createServer( this.onRequest( jar ).bind( this ) ).listen( 3000 );
  }

  onRequest(jar)
  {
    return (incomingMessage, response) =>
    {
      let that = this;

      that.getIncomingBody( body =>
      {
        // clear cookies
        if( body.reset )
          jar = request.jar();

        let options =
        {
          jar: jar,
          time: true,
          url: body.query,
          method: body.method,
          body: body.body,
          headers: this.getHeaders( body.headers )
        };

        that.sendRequest( result =>
        {
          response.writeHead( 200, { 'Content-Type': 'text/json' } );
          response.end( result );

        }, options )

      }, incomingMessage );
    }
  }

  getIncomingBody(callback, incomingMessage)
  {
    var data = '';

    incomingMessage.on( 'readable', (foo) =>
    {
      let chunk = incomingMessage.read();

      if( chunk )
        data += chunk;
    });

    incomingMessage.on( 'end', () => callback( JSON.parse( data ).body ) );
  }

  sendRequest(callback, options)
  {
    request( options, (error, response, body) =>
    {
      response = response || {
        statusCode: 404,
        headers: null,
        elapsedTime: null
      };

      let result = JSON.stringify(
      {
        statusCode: response.statusCode,
        headers: JSON.stringify( response.headers ),
        time: response.elapsedTime,
        body: body
      });

      callback( result );
    });
  }

  getURLWithoutProtocol(query)
  {
    return query.replace( 'https://', '' ).replace( 'http://', '' );
  }

  getHostname(query)
  {
    return this.getURLWithoutProtocol( query ).split( '/' )[ 0 ];
  }

  getHeaders(string)
  {
    let object = JSON.parse( string || '{}' );

    if( !object[ "Accept" ] ) object[ "Accept" ] = '*/*';

    return object;
  }
}

let nodeProxy = new NodeProxy();
