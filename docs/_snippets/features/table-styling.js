/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/* globals ClassicEditor, CKEditorPlugins, console, window, document */

import { CS_CONFIG } from '@ckeditor/ckeditor5-cloud-services/tests/_utils/cloud-services-config';

ClassicEditor
	.create( document.querySelector( '#snippet-table-styling' ), {
		extraPlugins: [
			CKEditorPlugins.TableProperties,
			CKEditorPlugins.TableCellProperties,
		],
		cloudServices: CS_CONFIG,
		toolbar: {
			items: [
				'insertTable', '|', 'heading', '|', 'bold', 'italic', '|', 'undo', 'redo'
			],
			viewportTopOffset: window.getViewportTopOffsetConfig()
		},
		table: {
			contentToolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties' ]
		}
	} )
	.then( editor => {
		window.editorStyling = editor;
	} )
	.catch( err => {
		console.error( err.stack );
	} );