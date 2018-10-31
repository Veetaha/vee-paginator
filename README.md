# vee-paginator
[![npm version](https://badge.fury.io/js/vee-paginator.svg)](https://badge.fury.io/js/vee-paginator)

Paginator is a simple  module for implementing browser pagination written in TypeScript.

This package requires JQuery library, so you have to import it via your HTML tag or bundling system before using Paginator.

~~~html
<script
        src="https://code.jquery.com/jquery-3.3.1.min.js"
        integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
        crossorigin="anonymous"
></script>
~~~

## `abstract class Paginator<TData>`

This class is basic for this module. It implements the most generic pagination logic, you would rather inherit from its child classes (e.g. `AjaxPaginator`). You need to provide buttons of `JQuery<HTMLButtonElement>` type to browse pages of data, to launch a search query and a `JQuery<HTMLInputElement>` to get search input from the user. Data fetching, displaying and validation logic is implemented by custom child classes via `abstract` methods, where you are provided with the maximum useful information you need. Paginator will take care of counting pages, disabling buttons, listening for search input queries and page browsing events. If you want an AJAX oriented class which helps you to form get requests and validate server data, see `AjaxPaginator<T>` bellow.

* `TData` is the type of data, served by `Paginator`, you fetch and use this data via some abstract functions (e.g. `displayPageData()`)

## `constructor(options)`
Constructor can only be invoked via a child class using `super(options)`. `options` is object with the following properties:

* `buttonPrev:         JQuery<HTMLButtonElement>` - button used to browse one page back
* `buttonNext:         JQuery<HTMLButtonElement>` - button used to browse one page forward
* `searchButton?:      JQuery<HTMLButtonElement>` - optional button to launch search query 
* `searchInputElement: JQuery<HTMLInputElement>` - text input element for entering search queries
* `itemsPerPage?:      number` -  number of items to display per page (*20* by default) 
* `startingPage?:      number` - page to start pagination (*0* by default), **page counting is 0-based**
* `saveDisplayedData?: boolean` - specifies whether to save obtained data in `displayedData` property or not (*false* by default)

### Public readonly properties
* `buttonPrev:         JQuery<HTMLButtonElement>` === `options.buttonPrev`
* `buttonNext:         JQuery<HTMLButtonElement>` === `options.buttonNext`
* `searchButton?:      JQuery<HTMLButtonElement>` === `options.searchButton`
* `searchInputElement: JQuery<HTMLInputElement>` === `options.searchInputelement`
* `itemsPerPage: number` === `options.itemsPerPage`
* `currentPage: number` - current page number (**0-based**)
* `lastQuery: string` - search query input that current data is displayed for
* `availablePages: number` - return value of the last `getAvailablePages()` call
* `displayedData?: TData` - optional property which stores last fetched data, it is absent absent if `saveDisplayedData` constructor option was *false*

### Public mutable properties

* `currentInput` - current contents of `searchInputElement`, assign a string to this property to change it




In order to use Paginator you have to 
*extend* it and *implement* all its abstract functions with your own custom class.

### Protected abstract methods

### `fetchPageData(page, searchInput): Promise<TData>`
Implement data fetching logic in this method in your child class and return a promise for `TData`.
* `page: number` - number of the page to get data for
* `searchInput: string` - contents of `searchInputElement` element for this query (user search string)

### `displayPageData(data)`
 Implement data displaying logic in this method in your child class.
* `data: TData` latest data resolved from a `Promise<TData>` returned by `fetchPageData()`, use it to refresh your page content

### `getAvailablePages(data: TData): number`
Returns the number of available pages according to given fetched `data`. This method should be [pure](https://en.wikipedia.org/wiki/Pure_function), it just returns a value and does no rendering.


## `abstract class AjaxPaginator<TServerData>`
This class extends `Paginator<TServerData>` it adds methods for making AJAX get requests to the specified url and data validation utilities.

  
 ## `constructor(options)`
 Constructor can only be invoked via a child class using `super(options)`. `options` is object that extends `PaginatorOptions`, all options specified here are forwarded to `Paginator` constructor. Additional options for this class:
 
 * `jqueryAjaxSettings?:         JQuery<HTMLButtonElement>` - settings object forwarded to JQuery `ajax()` function as `$.ajax(url, jqueryAjaxSettings)`
 * `dataTd?: Types.TypeDescription` - data ['vee-type-safe'](https://www.npmjs.com/package/vee-type-safe)`.TypeDescription` object that is used in `isValidData()` method for validating fetched data as `Types.conforms(data, dataTd)`






