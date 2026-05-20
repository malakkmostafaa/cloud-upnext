function KanbanColumn({
  title,
  children,
}) {

  return (

    <div
      className="
        bg-gray-100
        rounded-3xl
        p-4
        min-h-[700px]
        flex flex-col
      "
    >

      <h2
        className="
          text-2xl
          font-bold
          mb-6
          text-slate-900
        "
      >
        {title}
      </h2>

      <div className="space-y-4">

        {children}

      </div>

    </div>

  );

}

export default KanbanColumn;