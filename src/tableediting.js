/**
 * @license Copyright (c) 2003-2020, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module table/tableediting
 */

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

import upcastTable, { upcastTableCell } from './converters/upcasttable';
import {
	downcastInsertCell,
	downcastInsertRow,
	downcastInsertTable,
	downcastRemoveRow,
	downcastTableHeadingColumnsChange,
	downcastTableHeadingRowsChange
} from './converters/downcast';

import InsertTableCommand from './commands/inserttablecommand';
import InsertRowCommand from './commands/insertrowcommand';
import InsertColumnCommand from './commands/insertcolumncommand';
import SplitCellCommand from './commands/splitcellcommand';
import MergeCellCommand from './commands/mergecellcommand';
import RemoveRowCommand from './commands/removerowcommand';
import RemoveColumnCommand from './commands/removecolumncommand';
import SetHeaderRowCommand from './commands/setheaderrowcommand';
import SetHeaderColumnCommand from './commands/setheadercolumncommand';
import MergeCellsCommand from './commands/mergecellscommand';
import SelectRowCommand from './commands/selectrowcommand';
import SelectColumnCommand from './commands/selectcolumncommand';
import TableUtils from '../src/tableutils';

import injectTableLayoutPostFixer from './converters/table-layout-post-fixer';
import injectTableCellParagraphPostFixer from './converters/table-cell-paragraph-post-fixer';
import injectTableCellRefreshPostFixer from './converters/table-cell-refresh-post-fixer';

import '../theme/tableediting.css';
import { toWidgetEditable } from '@ckeditor/ckeditor5-widget/src/utils';

/**
 * The table editing feature.
 *
 * @extends module:core/plugin~Plugin
 */
export default class TableEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'TableEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const model = editor.model;
		const schema = model.schema;
		const conversion = editor.conversion;
		const editing = editor.editing;

		schema.register( 'table', {
			allowWhere: '$block',
			allowAttributes: [ 'headingRows', 'headingColumns' ],
			isLimit: true,
			isObject: true,
			isBlock: true
		} );

		schema.register( 'tableRow', {
			allowIn: 'table',
			isLimit: true
		} );

		schema.register( 'tableCell', {
			allowIn: 'tableRow',
			allowAttributes: [ 'colspan', 'rowspan' ],
			isObject: true
		} );

		//This is a schema to create a div in a table cell
		schema.register('divisionLeft', {
			isLimit: true,
			allowIn: 'tableCell',
			allowContentOf: '$root'
		});

		schema.register('divisionRight', {
			isLimit: true,
			allowIn: 'tableCell',
			allowContentOf: '$root'
		})

		// Allow all $block content inside table cell.
		schema.extend( '$block', { allowIn: 'tableCell' } );

		// Disallow table in table.
		schema.addChildCheck( ( context, childDefinition ) => {
			
			if ( childDefinition.name == 'table' && Array.from( context.getNames() ).includes( 'table' ) ) {
				return false;
			}
		} );

		//Disallow paragraph in table cells
		schema.addChildCheck( ( context, childDefinition ) => {
			if ( childDefinition.name != 'paragraph' && Array.from( context.getNames() ).includes( 'td' ) ) {
				return false;
			}
		} );

		// Conversion for the division to div
		conversion.for('upcast').elementToElement({
			model: 'divisionRight',
			 view: {
				name:'div',
			 	classes:'bubble-right'
			}
		});

		conversion.for('dataDowncast').elementToElement({
			model: 'divisionRight',
			 view: {
				name:'div',
			 	classes:'bubble-right'
			}
		});

		conversion.for('editingDowncast').elementToElement({
			model:'divisionRight',
			view:(modelElement, viewWriter) => {
				const divisionRight = viewWriter.createEditableElement('div', {class:'bubble-right'});
				return toWidgetEditable(divisionRight, viewWriter);
			}
		});
		
		conversion.for('upcast').elementToElement({
			model: 'divisionLeft',
			 view: {
				name:'div',
			 	classes:'bubble-left'
			}
		});

		conversion.for('dataDowncast').elementToElement({
			model: 'divisionLeft',
			 view: {
				name:'div',
			 	classes:'bubble-left'
			}
		});

		conversion.for('editingDowncast').elementToElement({
			model:'divisionLeft',
			view:(modelElement, viewWriter) => {
				const divisionLeft = viewWriter.createEditableElement('div', {class:'bubble-left'});
				return toWidgetEditable(divisionLeft, viewWriter);
			}
		});


		// Table conversion.
		conversion.for( 'upcast' ).add( upcastTable() );

		conversion.for( 'editingDowncast' ).add( downcastInsertTable( { asWidget: true } ) );
		conversion.for( 'dataDowncast' ).add( downcastInsertTable() );

		// Table row conversion.
		conversion.for( 'upcast' ).elementToElement( { model: 'tableRow', view: 'tr' } );

		conversion.for( 'editingDowncast' ).add( downcastInsertRow( { asWidget: true } ) );
		conversion.for( 'dataDowncast' ).add( downcastInsertRow() );
		conversion.for( 'downcast' ).add( downcastRemoveRow() );

		// Table cell conversion.
		conversion.for( 'upcast' ).add( upcastTableCell( 'td' ) );
		conversion.for( 'upcast' ).add( upcastTableCell( 'th' ) );

		conversion.for( 'editingDowncast' ).add( downcastInsertCell( { asWidget: true } ) );
		conversion.for( 'dataDowncast' ).add( downcastInsertCell() );

		// Table attributes conversion.
		conversion.attributeToAttribute( { model: 'colspan', view: 'colspan' } );
		conversion.attributeToAttribute( { model: 'rowspan', view: 'rowspan' } );

		// Table heading rows and columns conversion.
		conversion.for( 'editingDowncast' ).add( downcastTableHeadingColumnsChange( { asWidget: true } ) );
		conversion.for( 'dataDowncast' ).add( downcastTableHeadingColumnsChange() );
		conversion.for( 'editingDowncast' ).add( downcastTableHeadingRowsChange( { asWidget: true } ) );
		conversion.for( 'dataDowncast' ).add( downcastTableHeadingRowsChange() );


		// editing.downcastDispatcher.on( 'insert:tableCell', ( evt, data, conversionApi ) => {
		// 	// Remember to check whether the change has not been consumed yet and consume it.
		// 	if ( conversionApi.consumable.consume( data.item, 'insert' ) ) {
		// 		return;
		// 	}
		
		// 	// Translate position in model to position in view.
		// 	const viewPosition = conversionApi.mapper.toViewPosition( data.range.start );
		
		// 	// Create <p> element that will be inserted in view at `viewPosition`.
		// 	const viewElement = conversionApi.writer.createContainerElement( 'p' );
		
		// 	// Bind the newly created view element to model element so positions will map accordingly in future.
		// 	conversionApi.mapper.bindElements( data.item, viewElement );
		// 	conversionApi.writer.addClass('bubble',viewElement);
		// 	// Add the newly created view element to the view.
		// 	conversionApi.writer.insert( viewPosition, viewElement );
		
		// 	// Remember to stop the event propagation.
		// 	evt.stop();
		// } );


		// Define all the commands.
		editor.commands.add( 'insertTable', new InsertTableCommand( editor ) );
		editor.commands.add( 'insertTableRowAboveLeft', new InsertRowCommand( editor, { order: 'above', position: 'left' } ) );
		editor.commands.add( 'insertTableRowBelowLeft', new InsertRowCommand( editor, { order: 'below', position: 'left' } ) );
		editor.commands.add( 'insertTableRowAboveRight', new InsertRowCommand( editor, { order: 'above', position: 'right'} ) );
		editor.commands.add( 'insertTableRowBelowRight', new InsertRowCommand( editor, { order: 'below', position: 'right'} ) );
		// editor.commands.add( 'insertTableColumnLeft', new InsertColumnCommand( editor, { order: 'left' } ) );
		// editor.commands.add( 'insertTableColumnRight', new InsertColumnCommand( editor, { order: 'right' } ) );

		editor.commands.add( 'removeTableRow', new RemoveRowCommand( editor ) );
		// editor.commands.add( 'removeTableColumn', new RemoveColumnCommand( editor ) );

		editor.commands.add( 'splitTableCellVertically', new SplitCellCommand( editor, { direction: 'vertically' } ) );
		editor.commands.add( 'splitTableCellHorizontally', new SplitCellCommand( editor, { direction: 'horizontally' } ) );

		editor.commands.add( 'mergeTableCells', new MergeCellsCommand( editor ) );

		editor.commands.add( 'mergeTableCellRight', new MergeCellCommand( editor, { direction: 'right' } ) );
		editor.commands.add( 'mergeTableCellLeft', new MergeCellCommand( editor, { direction: 'left' } ) );
		editor.commands.add( 'mergeTableCellDown', new MergeCellCommand( editor, { direction: 'down' } ) );
		editor.commands.add( 'mergeTableCellUp', new MergeCellCommand( editor, { direction: 'up' } ) );

		editor.commands.add( 'setTableColumnHeader', new SetHeaderColumnCommand( editor ) );
		editor.commands.add( 'setTableRowHeader', new SetHeaderRowCommand( editor ) );

		editor.commands.add( 'selectTableRow', new SelectRowCommand( editor ) );
		editor.commands.add( 'selectTableColumn', new SelectColumnCommand( editor ) );

		injectTableLayoutPostFixer( model );
		injectTableCellRefreshPostFixer( model );
		injectTableCellParagraphPostFixer( model );


	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ TableUtils ];
	}
}
