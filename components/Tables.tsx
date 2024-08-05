"use client";
import React from "react";
import {
  useTable,
  useGlobalFilter,
  useAsyncDebounce,
  useFilters,
  useSortBy,
  usePagination,
} from "react-table";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
  //@ts-ignore
} from "@heroicons/react/solid";
import { MdOutlineDeleteOutline, MdQueue } from "react-icons/md";
import { RiEmotionHappyLine } from "react-icons/ri";

import {
  DequeueItemsParams,
  EnqueueItemsParams,
  Item,
  Question,
  Queue,
  Topic,
  View,
} from "@/utils";

/**
 * Helpers
 */
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export function SortIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z"></path>
    </svg>
  );
}

export function SortUpIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"></path>
    </svg>
  );
}

export function SortDownIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="currentColor"
      strokeWidth="0"
      viewBox="0 0 320 512"
      height="1em"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"></path>
    </svg>
  );
}

export function Button({
  children,
  className,
  ...rest
}: { children: JSX.Element[]; className: string } & any) {
  return (
    <button
      type="button"
      className={classNames(
        "relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
function PageButton({ children, className, ...rest }: any) {
  return (
    <button
      type="button"
      className={classNames(
        "relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function GlobalFilter({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}: any) {
  const count = preGlobalFilteredRows.length;
  const [value, setValue] = React.useState(globalFilter);
  const onChange = useAsyncDebounce((value) => {
    setGlobalFilter(value || undefined);
  }, 200);

  return (
    <label className="flex gap-x-2 items-baseline">
      <span className="text-gray-700">Search: </span>
      <input
        type="text"
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        value={value || ""}
        onChange={(e) => {
          setValue(e.target.value);
          onChange(e.target.value);
        }}
        placeholder={`${count} records...`}
      />
    </label>
  );
}

export function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id, render },
}: any) {
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach((row: any) => {
      options.add(row.values[id]);
    });
    //@ts-ignore
    return [...options.values()];
  }, [id, preFilteredRows]);

  return (
    <label className="flex gap-x-2 items-baseline">
      <span className="text-gray-700">{render("Header")}: </span>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        name={id}
        id={id}
        value={filterValue}
        onChange={(e) => {
          setFilter(e.target.value || undefined);
        }}
      >
        <option value="">All</option>
        {options.map((option, i) => (
          //@ts-ignore
          <option key={i} value={option}>
            {/*@ts-ignore*/}
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Topics Table
 */
export const TOPICS_TABLE_COLUMNS = [
  {
    Header: "Topic",
    accessor: "shortSummary",
  },
  {
    Header: "Sentiment Rating",
    accessor: "sentimentRating",
    Filter: SelectColumnFilter,
    filter: "includes",
    Cell: SentimentPill,
  },
  {
    Header: "Description",
    accessor: "longSummary",
  },
  {
    Header: "Actions",
    accessor: "_id",
    Cell: ActionCell,
  },
];

export const QUESTIONS_TABLE_COLUMNS = [
  {
    Header: "Question",
    accessor: "question",
  },
  {
    Header: "User",
    accessor: "user",
    Filter: SelectColumnFilter,
    filter: "includes",
    Cell: SentimentPill,
  },
  {
    Header: "Actions",
    accessor: "_id",
    Cell: ActionCell,
  },
];

export function SentimentPill({ value }: { value: number }) {
  return (
    <span
      className={classNames(
        "px-3 py-1 uppercase leading-wide font-bold text-xs rounded-full shadow-sm",
        value >= 750 ? "bg-green-100 text-green-700" : "",
        value > 499 && value < 750 ? "bg-yellow-100 text-yellow-700" : "",
        value <= 498 ? "bg-red-100 text-red-700" : ""
      )}
    >
      {value}
    </span>
  );
}

export function ActionCell({
  handleDelete,
  queueItem,
  view,
  key,
}: {
  key: string;
  view: View;
  handleDelete: () => Promise<void>;
  queueItem: () => Promise<void>;
}) {
  const modalId = `modal-${key}-1`;
  const modalId2 = `modal-${key}-2`;
  return (
    <div>
      <dialog id={modalId} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Are you sure you want to delete this{" "}
            {view === "TOPICS" ? "tpic" : "question"}?
          </h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="btn btn-active btn-error"
                onClick={async () => {
                  await handleDelete();
                }}
              >
                Delete
              </button>

              <button className="btn btn-active btn-neutral">Cancel</button>
            </form>
          </div>
        </div>
      </dialog>
      <dialog id={modalId2} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Are you sure you want to add this{" "}
            {view === "TOPICS" ? "tpic" : "question"} to list of queued items?
          </h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button
                className="btn btn-active btn-error"
                onClick={async () => {
                  await queueItem();
                }}
              >
                Add to Queued {view === "TOPICS" ? "Topics" : "Questions"}
              </button>

              <button className="btn btn-active btn-neutral">Cancel</button>
            </form>
          </div>
        </div>
      </dialog>
      <MdOutlineDeleteOutline
        className="text-red-600"
        //@ts-ignore
        onClick={() => document.getElementById(modalId).showModal()}
      />
      <MdQueue
        className="text-red-600"
        //@ts-ignore
        onClick={() => document.getElementById(modalId2).showModal()}
      />
    </div>
  );
}

/*********
 * Table
 *********/
interface TableProps {
  data: Item[];
  handleDelete: (id: Item) => void;
  handleEnqueueItem: (
    params: Pick<EnqueueItemsParams, "items">
  ) => Promise<void>;
  columns: typeof TOPICS_TABLE_COLUMNS | typeof QUESTIONS_TABLE_COLUMNS;
  view: View;
}

const getTopicFromCell = (cells: any): Item => ({
  shortSummary: cells[0].value,
  sentimentRating: cells[1].value,
  longSummary: cells[2].value,
});

const getQuestionFromCell = (cells: any): Item => ({
  question: cells[0].value,
  user: cells[1].value,
});

type TableType = "QUESTIONS" | "TOPICS";
const getType = (header: string): TableType =>
  header === "Question" ? "QUESTIONS" : "TOPICS";

const Table = ({
  data,
  handleDelete,
  handleEnqueueItem,
  columns,
  view,
}: TableProps): JSX.Element => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    ...rest
  } = useTable(
    {
      //@ts-ignore
      columns,
      data,
    },
    useFilters,
    useGlobalFilter,
    useSortBy,
    usePagination
  );

  const {
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
  } = rest as any;

  const getQueueItemHelper = React.useCallback(
    (item: Topic | Question) => async (): Promise<void> => {
      await handleEnqueueItem({
        items: [item as Topic | Question],
      });
    },
    [handleEnqueueItem, view]
  );

  const handleItemDelete = async (cell: any) => {
    if (getType(columns[0]?.Header) === "QUESTIONS") {
      await handleDelete(getQuestionFromCell(cell.row.cells));
    } else if (getType(columns[0]?.Header) === "TOPICS") {
      await handleDelete(getTopicFromCell(cell.row.cells));
    }
  };
  return (
    <div className="mt-8 p-8 mt-4 shadow border-b border-gray-200">
      <div className="flex gap-x-2">
        <GlobalFilter
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </div>
      <div className="mt-2 flex flex-col">
        <div className="-my-2 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"></div>
            {headerGroups.map((headerGroup) =>
              headerGroup.headers.map((column) =>
                //@ts-ignore
                column.Filter ? (
                  <div key={column.id}>{column.render("Filter")}</div>
                ) : null
              )
            )}
            {headerGroups.map((headerGroup) =>
              headerGroup.headers.map((column) => (
                <th
                  scope="col"
                  className="group px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  //@ts-ignore
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={column.getHeaderProps().key}
                >
                  <div className="flex items-center justify-between">
                    {column.render("Header")}
                    {/* Add a sort direction indicator */}
                    <span>
                      {/**@ts-ignore/ */}
                      {column.isSorted ? (
                        //@ts-ignore
                        column.isSortedDesc ? (
                          <SortDownIcon className="w-4 h-4 text-gray-400" />
                        ) : (
                          <SortUpIcon className="w-4 h-4 text-gray-400" />
                        )
                      ) : (
                        <SortIcon className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                      )}
                    </span>
                  </div>
                </th>
              ))
            )}
            <table
              {...getTableProps()}
              className="min-w-full divide-y divide-gray-200"
            >
              <tbody
                {...getTableBodyProps()}
                //@ts-ignore
                className="bg-white divide-y divide-gray-200"
              >
                {page.map((row: any) => {
                  prepareRow(row);
                  const { key, ...rest } = row.getRowProps();
                  return (
                    <tr {...rest} key={key}>
                      {/*@ts-ignore*/}
                      {row.cells.map((cell, idx) => {
                        const { key, ...rest } = cell.getCellProps();
                        return (
                          <td
                            {...rest}
                            key={key}
                            className="px-6 py-4 whitespace-nowrap"
                            role="cell"
                          >
                            {cell.column.Cell.name === "defaultRenderer" ? (
                              <div className="text-sm text-gray-500">
                                {cell.render(
                                  "Cell",
                                  cell.column.Header === "Actions"
                                    ? {
                                        handleDelete: async () => {
                                          handleItemDelete(cell);
                                        },
                                        queueItem: getQueueItemHelper(
                                          row.values
                                        ),
                                        view,
                                        key: cell.value,
                                      }
                                    : {}
                                )}
                              </div>
                            ) : (
                              cell.render(
                                "Cell",
                                cell.column.Header === "Actions"
                                  ? {
                                      handleDelete: async () => {
                                        handleItemDelete(cell);
                                      },
                                      queueItem: getQueueItemHelper(row.values),
                                      view,
                                      key: cell.value,
                                    }
                                  : {}
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="py-3 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
            Previous
          </Button>
          <Button onClick={() => nextPage()} disabled={!canNextPage}>
            Next
          </Button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div className="flex gap-x-2">
            <span className="text-sm text-gray-700">
              Page <span className="font-medium">{state.pageIndex + 1}</span> of{" "}
              {pageOptions.length}
            </span>
          </div>
          <div className="flex gap-x-2">
            <label>
              <span className="sr-only">Items Per Page</span>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={state.pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                }}
              >
                {[5, 10, 20, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    Show {pageSize}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <nav
              className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
              aria-label="Pagination"
            >
              <PageButton
                className="rounded-l-md"
                onClick={() => gotoPage(0)}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">First</span>
                <ChevronDoubleLeftIcon className="h-5 w-5" aria-hidden="true" />
              </PageButton>
              <PageButton
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
              >
                <span className="sr-only">Previous</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </PageButton>
              <PageButton onClick={() => nextPage()} disabled={!canNextPage}>
                <span className="sr-only">Next</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
              </PageButton>
              <PageButton
                className="rounded-r-md"
                onClick={() => gotoPage(pageCount - 1)}
                disabled={!canNextPage}
              >
                <span className="sr-only">Last</span>
                <ChevronDoubleRightIcon
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </PageButton>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Instantiations of Table
 */
export const TopicsTable = (
  props: Omit<TableProps, "columns">
): JSX.Element => <Table columns={TOPICS_TABLE_COLUMNS} {...props} />;

export const QuestionsTable = (
  props: Omit<TableProps, "columns">
): JSX.Element => <Table columns={QUESTIONS_TABLE_COLUMNS} {...props} />;

export const QueueTable = ({
  dequeItem,
  queue = [],
}: {
  dequeItem: (itemIds: Pick<DequeueItemsParams, "itemIds">) => Promise<void>;
  queue: Queue;
}) => {
  const QuestionRow = ({
    question,
    idx,
  }: {
    question: Question;
    idx: number;
  }) => (
    <>
      <tr>
        <th>{idx}</th>
        <td>question</td>
        <td>{JSON.stringify(question)}</td>
        <MdOutlineDeleteOutline
          className="text-red-600"
          //@ts-ignore
          onClick={() => dequeItem([question._id])}
        />
      </tr>
    </>
  );

  const TopicRow = ({ topic, idx }: { topic: Topic; idx: number }) => (
    <>
      <th>{idx}</th>
      <td>topic</td>
      <td>
        {" "}
        <div
          tabIndex={0}
          className="collapse collapse-arrow border-base-300 bg-base-200 border"
        >
          <div className="collapse-title text-xl font-medium">
            {topic.shortSummary}{" "}
            <MdOutlineDeleteOutline
              className="text-red-600"
              //@ts-ignore
              onClick={() => dequeItem([topic._id])}
            />
          </div>
          <div className="collapse-content">
            <div className="card bg-base-100 w-96 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {Number(topic.sentimentRating) >= 750 ? (
                    <RiEmotionHappyLine />
                  ) : null}
                  {Number(topic.sentimentRating) > 333 &&
                  Number(topic.sentimentRating) < 750 ? (
                    <RiEmotionHappyLine />
                  ) : null}
                  {Number(topic.sentimentRating) <= 333 ? (
                    <RiEmotionHappyLine />
                  ) : null}
                </h2>
                <p>{topic.longSummary}</p>
              </div>
            </div>
          </div>
        </div>
      </td>
    </>
  );

  return (
    <div className="overflow-x-auto">
      <table className="table">
        {/* head */}
        <thead>
          <tr>
            <th></th>
            <th>Type</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((item: Item, idx) => {
            if (item.question) {
              const question: Question = {
                question: item.question!,
                user: item.user!,
              };
              return <QuestionRow question={question} idx={idx} />;
            } else if (item.longSummary) {
              const topic: Topic = {
                longSummary: item.longSummary!,
                shortSummary: item.shortSummary!,
                sentimentRating: item.sentimentRating!,
              };
              return <TopicRow topic={topic} idx={idx} />;
            }
          })}
        </tbody>
      </table>
    </div>
  );
};
