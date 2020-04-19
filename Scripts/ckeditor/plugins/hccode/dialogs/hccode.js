'use strict';

( function() {
	CKEDITOR.dialog.add( 'hccode', function( editor ) {
		var hcCodeLangs = editor._.hccode.langs,
			lang = editor.lang.hccode,
			clientHeight = document.documentElement.clientHeight,
			langSelectItems = [],
			hcCodeLangId;

		langSelectItems.push( [ editor.lang.common.notSet, '' ] );

		for ( hcCodeLangId in hcCodeLangs )
			langSelectItems.push( [ hcCodeLangs[ hcCodeLangId ], hcCodeLangId ] );

		// Size adjustments.
		var size = CKEDITOR.document.getWindow().getViewPaneSize(),
			// Make it maximum 800px wide, but still fully visible in the viewport.
			width = Math.min( size.width - 70, 800 ),
			// Make it use 2/3 of the viewport height.
			height = size.height / 1.5;

		// Low resolution settings.
		if ( clientHeight < 650 ) {
			height = clientHeight - 220;
		}

		return {
			title: lang.title,
			minHeight: 200,
			resizable: CKEDITOR.DIALOG_RESIZE_NONE,
			contents: [
				{
					id: 'info',
					elements: [
                        {
                            type: 'hbox',
                            widths: ['50%', '50%'],
                            children: [
                                {
                                    id: 'lang',
                                    type: 'select',
                                    label: lang.language,
                                    items: langSelectItems,
                                    setup: function (widget) {
                                        if (widget.ready && widget.data.lang)
                                            this.setValue(widget.data.lang);
                                        else
                                            this.setValue('delphi');
                                        // The only way to have an empty select value in Firefox is
                                        // to set a negative selectedIndex.
                                        if (CKEDITOR.env.gecko && (!widget.data.lang || !widget.ready))
                                            this.getInputElement().$.selectedIndex = 0;//-1;
                                    },
                                    commit: function (widget) {
                                        widget.setData('lang', this.getValue());
                                    }
                                },
                                {
                                    id: 'display',
                                    type: 'checkbox',
                                    label: lang.displayInline,
                                    setup: function (widget) {
                                        if (widget.ready && widget.data.display)
                                            this.setValue(widget.data.display == 'inline');
                                        else
                                            this.setValue(false);
                                    },
                                    commit: function (widget) {
                                        widget.setData('display', this.getValue() ? 'inline' : 'box');
                                    }
                                }
                            ]
                        },
						{
							id: 'code',
							type: 'textarea',
							label: lang.codeContents,
							setup: function( widget ) {
							    if (widget.data.code)
							        this.setValue(widget.data.code);
							    else
							        this.setValue(editor.getSelection().getSelectedText());
							},
							commit: function( widget ) {
								widget.setData( 'code', this.getValue() );
							},
							required: true,
							validate: CKEDITOR.dialog.validate.notEmpty( lang.emptyhcCodeError ),
							inputStyle: 'cursor:auto;' +
								'width:' + width + 'px;' +
								'height:' + height + 'px;' +
								'tab-size:4;' +
								'text-align:left;',
							'class': 'cke_source'
						}
					]
				}
			]
		};
	} );
}() );
