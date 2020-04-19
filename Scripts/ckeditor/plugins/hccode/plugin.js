'use strict';

( function() {
	var isBrowserSupported = !CKEDITOR.env.ie || CKEDITOR.env.version > 8;

	CKEDITOR.plugins.add( 'hccode', {
		requires: 'widget,dialog',
		lang: 'en,vi', // %REMOVE_LINE_CORE%
		icons: 'hccode', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%

		beforeInit: function( editor ) {
			editor._.hccode = {};

			/**
			 * Sets the custom syntax highlighter. See {@link CKEDITOR.plugins.hccode.highlighter}
			 * to learn how to register a custom highlighter.
			 *
			 * **Note**:
			 *
			 * * This method can only be called while initialising plugins (in one of
			 * the three callbacks).
			 * * This method is accessible through the `editor.plugins.hccode` namespace only.
			 *
			 * @since 4.4
			 * @member CKEDITOR.plugins.hccode
			 * @param {CKEDITOR.plugins.hccode.highlighter} highlighter
			 */
			this.setHighlighter = function( highlighter ) {
				editor._.hccode.highlighter = highlighter;

				var langs = editor._.hccode.langs =
					editor.config.hcCode_languages || highlighter.languages;

				// We might escape special regex chars below, but we expect that there
				// should be no crazy values used as lang keys.
				editor._.hccode.langsRegex = new RegExp( '(?:^|\\s)language-(' +
					CKEDITOR.tools.objectKeys( langs ).join( '|' ) + ')(?:\\s|$)' );
			};
		},

		onLoad: function() {
			CKEDITOR.dialog.add( 'hccode', this.path + 'dialogs/hccode.js' );
		},

		init: function( editor ) {
			editor.ui.addButton && editor.ui.addButton( 'hccode', {
				label: editor.lang.hccode.button,
				command: 'hccode',
				toolbar: 'insert,10'
			} );
		},

		afterInit: function( editor ) {
			var path = this.path;

			registerWidget( editor );

			// At the very end, if no custom highlighter was set so far (by plugin#setHighlighter)
			// we will set default one.
			if ( !editor._.hccode.highlighter ) {
				var hljsHighlighter = new CKEDITOR.plugins.hccode.highlighter( {
					languages: {
					    delphi: 'Pascal / Delphi',
					    html: 'HTML / XML',
					    css: 'CSS',
					    scss: 'SCSS',
					    less: 'LESS',
					    cpp: 'C++',
					    csharp: 'C#',
					    vbnet: 'VB.Net',
					    javascript: 'JavaScript',
					    java: 'Java',
					    php: 'PHP',
					    python: 'Python',
					    ruby: 'Ruby',
					    sql: 'SQL',
					    dos: 'DOS',
					    markdown: 'Markdown',
					    swift: 'Swift',
					    vbs: 'VBScript'
					},

					init: function( callback ) {
						var that = this;

						if ( isBrowserSupported ) {
							CKEDITOR.scriptLoader.load( path + 'lib/highlight/highlight.pack.js', function() {
								that.hljs = window.hljs;
								callback();
							} );
						}

						// Method is available only if wysiwygarea exists.
						if ( editor.addContentsCss ) {
							editor.addContentsCss( path + 'lib/highlight/styles/' + editor.config.hcCode_theme + '.css' );
						}
					},

					highlighter: function( code, language, callback ) {
						var highlighted = this.hljs.highlightAuto( code,
								this.hljs.getLanguage( language ) ? [ language ] : undefined );

						if ( highlighted )
							callback( highlighted.value );
					}
				} );

				this.setHighlighter( hljsHighlighter );
			}
		}
	} );

	CKEDITOR.plugins.hccode = {
		highlighter: Highlighter
	};

	function Highlighter( def ) {
		CKEDITOR.tools.extend( this, def );
		this.queue = [];

		// Async init – execute jobs when ready.
		if ( this.init ) {
			this.init( CKEDITOR.tools.bind( function() {
				// Execute pending jobs.
				var job;

				while ( ( job = this.queue.pop() ) )
					job.call( this );

				this.ready = true;
			}, this ) );
		} else {
			this.ready = true;
		}

	}

	Highlighter.prototype.highlight = function() {
		var arg = arguments;

		// Highlighter is ready – do it now.
		if ( this.ready )
			this.highlighter.apply( this, arg );
		// Queue the job. It will be done once ready.
		else {
			this.queue.push( function() {
				this.highlighter.apply( this, arg );
			} );
		}
	};

	// Encapsulates snippet widget registration code.
	// @param {CKEDITOR.editor} editor
	function registerWidget( editor ) {
	    var codeClass = editor.config.hcCode_codeClass,
            preClass = editor.config.hcCode_preClass,
			newLineRegex = /\r?\n/g,
			textarea = new CKEDITOR.dom.element( 'textarea' ),
			lang = editor.lang.hccode;

		editor.widgets.add( 'hccode', {
			allowedContent: 'span(hc-*); code(language-*)',
			// Actually we need both - span and code, but ACF does not make it possible
			// to defire required content with "and" operator.
			requiredContent: 'span',
			styleableElements: 'span',
			template: '<span class="' + preClass + '"><code class="' + codeClass + '"></code></span>',
			dialog: 'hccode',
			pathName: lang.pathName,
			mask: true,

			parts: {
			    span: 'span',
				code: 'code'
			},

			highlight: function() {
				var that = this,
					widgetData = this.data,
					callback = function( formatted ) {
						// IE8 (not supported browser) have issue with new line chars, when using innerHTML.
						// It will simply strip it.
						that.parts.code.setHtml( isBrowserSupported ?
							formatted : formatted.replace( newLineRegex, '<br>' ) );
					};

				// Set plain code first, so even if custom handler will not call it the code will be there.
				callback( CKEDITOR.tools.htmlEncode( widgetData.code ) );

				// Call higlighter to apply its custom highlighting.
				editor._.hccode.highlighter.highlight( widgetData.code, widgetData.lang, function( formatted ) {
					editor.fire( 'lockSnapshot' );
					callback( formatted );
					editor.fire( 'unlockSnapshot' );
				} );
			},

			data: function() {
				var newData = this.data,
					oldData = this.oldData;

				if ( newData.code )
					this.parts.code.setHtml( CKEDITOR.tools.htmlEncode( newData.code ) );
			    // Remove old .hc-* class
				if (oldData && newData.display != oldData.display)
				    this.parts.span.removeClass('hc-' + oldData.display);
			    // Display needs to be specified in order to apply formatting.
				if (newData.display) {
				    // Apply new .hc-* class.
				    this.parts.span.addClass('hc-' + newData.display);
				}
				// Remove old .language-* class.
				if ( oldData && newData.lang != oldData.lang )
					this.parts.code.removeClass( 'language-' + oldData.lang );
				// Lang needs to be specified in order to apply formatting.
				if ( newData.lang ) {
					// Apply new .language-* class.
					this.parts.code.addClass( 'language-' + newData.lang );
					this.highlight();
				}
				// Save oldData.
				this.oldData = CKEDITOR.tools.copy( newData );
			},

		    // Upcasts <span [class="hc-*"]><code [class="language-*"]>...</code></span>
			upcast: function( el, data ) {
				if ( el.name != 'span' )
					return;

				var childrenArray = getNonEmptyChildren( el ),
					code;

				if ( childrenArray.length != 1 || ( code = childrenArray[ 0 ] ).name != 'code' )
					return;

				// Upcast <code> with text only: https://dev.ckeditor.com/ticket/11926#comment:4
				if ( code.children.length != 1 || code.children[ 0 ].type != CKEDITOR.NODE_TEXT )
					return;

				// Read language-* from <code> class attribute.
				var matchResult = editor._.hccode.langsRegex.exec( code.attributes[ 'class' ] );

				if ( matchResult )
					data.lang = matchResult[ 1 ];

				// Use textarea to decode HTML entities (https://dev.ckeditor.com/ticket/11926).
				textarea.setHtml( code.getHtml() );
				data.code = textarea.getValue();

				code.addClass( codeClass );

				return el;
			},

		    // Downcasts to <span [class="hc-*"]><code [class="language-*"]>...</code></span>
			downcast: function( el ) {
				var code = el.getFirst( 'code' );

				// Remove pretty formatting from <code>...</code>.
				code.children.length = 0;

				// Remove config#hcCode_codeClass.
				code.removeClass( codeClass );

				// Set raw text inside <code>...</code>.
				code.add( new CKEDITOR.htmlParser.text( CKEDITOR.tools.htmlEncode( this.data.code ) ) );

				return el;
			}
		} );

		// Returns an **array** of child elements, with whitespace-only text nodes
		// filtered out.
		// @param {CKEDITOR.htmlParser.element} parentElement
		// @return Array - array of CKEDITOR.htmlParser.node
		var whitespaceOnlyRegex = /^[\s\n\r]*$/;

		function getNonEmptyChildren( parentElement ) {
			var ret = [],
				preChildrenList = parentElement.children,
				curNode;

			// Filter out empty text nodes.
			for ( var i = preChildrenList.length - 1; i >= 0; i-- ) {
				curNode = preChildrenList[ i ];

				if ( curNode.type != CKEDITOR.NODE_TEXT || !curNode.value.match( whitespaceOnlyRegex ) )
					ret.push( curNode );
			}

			return ret;
		}
	}
} )();

CKEDITOR.config.hcCode_codeClass = 'hljs';
CKEDITOR.config.hcCode_preClass = ''
CKEDITOR.config.hcCode_theme = 'hc';
