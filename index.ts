import 'jquery';
import * as Types from "vee-type-safe";

const BugMessage = 'Paginator: logic is broken, please issue a bug report';

export interface PaginatorOptions {
    buttonPrev:         JQuery<HTMLButtonElement>;
    buttonNext:         JQuery<HTMLButtonElement>;
    searchButton?:      JQuery<HTMLButtonElement>;
    searchInputElement: JQuery<HTMLInputElement>;
    itemsPerPage?:      number;
    startingPage?:      number;
    saveDisplayedData?: boolean;
}

export abstract class Paginator<TData = unknown> {
    protected abstract fetchPageData(
        page: number, searchInput: string
    ): Promise<TData>;
    protected abstract displayPageData(data: TData):   void;
    protected abstract getAvailablePages(data: TData): number;

    // Fields
    private static readonly DefaultAmountPerPage = 20;

    readonly buttonPrev:         JQuery<HTMLButtonElement>;
    readonly buttonNext:         JQuery<HTMLButtonElement>;
    readonly searchButton?:      JQuery<HTMLButtonElement>;
    readonly searchInputElement: JQuery<HTMLInputElement>;
    private readonly _itemsPerPage:   number;
    private          _currentPage:    number;
    private          _availablePages: number;
    private          _lastQuery:      string;
    private          _displayedData?: TData;
    private readonly _displayData:    (this: Paginator<TData>, data: TData) => void;
    // -----


    get itemsPerPage()   { return this._itemsPerPage;  }
    get currentPage()    { return this._currentPage; }
    get lastQuery()      { return this._lastQuery;   }
    get currentInput()   { return (this.searchInputElement.val() as string).trim(); }
    set currentInput(value: string) {
        this.searchInputElement.val(value);
    }
    get availablePages() { return this._availablePages; }
    get displayedData()  {
        return this._displayedData;
    }

    protected constructor(options: PaginatorOptions) {
        this.buttonPrev          = options.buttonPrev;
        this.buttonNext          = options.buttonNext;
        this.searchButton        = options.searchButton;
        this.searchInputElement  = options.searchInputElement;

        this._itemsPerPage   = Types.conforms<number>(
              options.itemsPerPage, Types.isPositiveInteger
        )   ? options.itemsPerPage
            : Paginator.DefaultAmountPerPage;

        this._currentPage = Types.conforms<number>(
              options.startingPage, Types.isZeroOrPositiveInteger
        )   ? options.startingPage
            : 0;

        this._displayData = options.saveDisplayedData
            ? Paginator.prototype.displayDataAndSave
            : Paginator.prototype.displayDataNoSave;

        this._availablePages = 0;
        this._lastQuery = '';
        this.setupEvents();
    }

    async launch() {
        await this.doSearch(0, '');
        this.updateButtons();
    }


    private updateButtons() {
        this.buttonPrev.prop('disabled', !this._currentPage);
        this.buttonNext.prop(
            'disabled',
            this._currentPage >= this._availablePages - 1
        );
    }

    private async loadPrevPage() {
        if (!this._currentPage) {
            return console.error(BugMessage);
        }
        if (!(this._currentPage - 1)) {
            this.buttonPrev.prop('disabled', true);
        }
        await this.doSearch(this._currentPage - 1, this._lastQuery);
    }

    private async loadNextPage() {
        if (this._currentPage >= this._availablePages - 1) {
            return console.error(BugMessage);
        }
        if (this._currentPage + 1 >= this._availablePages - 1) {
            this.buttonNext.prop('disabled', true);
        }
        await this.doSearch(this._currentPage + 1, this._lastQuery);
    }

    private async loadNewQuery() {
        await this.doSearch(0, this.currentInput);
    }

    private async doSearch(page: number, query: string) {
        try {
            const data = await this.fetchPageData(page, query);
            this._availablePages = this.getAvailablePages(data);
            this._currentPage    = page;
            this._lastQuery      = query;
            this._displayData(data);

        } catch (err) {
            console.error(`Paginator: failed to reload page:\n`, err);
        }
    }

    private setupEvents() {
        this.buttonPrev.on('click', () => this.loadPrevPage());
        this.buttonNext.on('click', () => this.loadNextPage());
        this.searchInputElement.on('keydown', (event) => {
            if (event.key === 'Enter') {
                void this.loadNewQuery();
            }
        });
        if (this.searchButton) {
            this.searchButton.on('click', () => this.loadNewQuery());
        }
    }

    private displayDataNoSave(data: TData) {
        this.updateButtons();
        this.displayPageData(data);
    }

    private displayDataAndSave(data: TData) {
        this.displayDataNoSave(this._displayedData = data);
    }
}

export interface AjaxPaginatorOptions extends PaginatorOptions {
    jqueryAjaxSettings?: JQuery.AjaxSettings;
    dataTd?: Types.TypeDescription;
}

export abstract class AjaxPaginator<TServerData = unknown> extends Paginator<TServerData> {
    private readonly jqueryAjaxSettings?: JQuery.AjaxSettings;
    private readonly dataTd?: Types.TypeDescription;

    constructor(options: AjaxPaginatorOptions){
        super(options);
        this.jqueryAjaxSettings = options.jqueryAjaxSettings;
        this.dataTd =  options.dataTd;
    }

    protected abstract getQueryUrl(page: number, searchInput: string): string;
    protected isValidData(suspect: unknown): suspect is TServerData {
        if (typeof this.dataTd !== 'undefined') {
            return Types.conforms<TServerData>(suspect, this.dataTd);
        } else {
            console.warn(
                'AjaxPaginator: no data validation is implemented for ajax requests, '
                + 'please specify dataTd option or override isValidData() method'
            );
            return true;
        }
    }

    protected async fetchPageData(page: number, searchInput: string) {
        const data = await $.ajax(this.getQueryUrl(page, searchInput),
            this.jqueryAjaxSettings
        );
        if (!this.isValidData(data)) {
            throw new Error(`Failed to fetch data from server, data:\n${
                JSON.stringify(data)
            }`);
        }
        return data;
    }

}


