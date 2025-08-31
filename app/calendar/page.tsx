"use client";

import {
  ArrowLeft,
  Info,
  ChevronRight,
  Plus,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getEventStatus } from "@/lib/eventUtils";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiUrl, imageUrl } from "@/lib/api";

export default function CalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  // Start with next month if we're at the end of current month (29th onwards)
  const shouldShowNextMonth = today.getDate() >= 29;
  const [currentMonth, setCurrentMonth] = useState(
    shouldShowNextMonth ? (today.getMonth() + 1) % 12 : today.getMonth()
  );
  const [currentYear, setCurrentYear] = useState(
    shouldShowNextMonth && today.getMonth() === 11
      ? today.getFullYear() + 1
      : today.getFullYear()
  );
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Type for date objects
  type DateItem = {
    date: number;
    day: string;
    fullDate: Date;
    month: number;
    year: number;
  };

  // Generate dates for the current month view
  const generateMonthDates = (): DateItem[] => {
    // Create a date for the first day of the selected month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get current date for comparison
    const today = new Date();
    const isCurrentMonth =
      currentMonth === today.getMonth() && currentYear === today.getFullYear();

    // For the current month, start from today
    // For other months, show first week
    let startDate;
    if (isCurrentMonth) {
      startDate = new Date(today);
    } else {
      startDate = new Date(firstDayOfMonth);
    }

    // Generate 7 days starting from the start date
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      // Make sure we don't go beyond the month for non-current months
      if (!isCurrentMonth && date.getMonth() !== currentMonth) {
        continue;
      }

      dates.push({
        date: date.getDate(),
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullDate: new Date(date),
        month: date.getMonth(),
        year: date.getFullYear(),
      });
    }

    // If we don't have enough dates and it's not the current month,
    // fill from the beginning of the month
    if (dates.length < 7 && !isCurrentMonth) {
      const additionalDates = [];
      for (let i = 1; i <= Math.min(7, lastDayOfMonth.getDate()); i++) {
        const date = new Date(currentYear, currentMonth, i);
        additionalDates.push({
          date: date.getDate(),
          day: date.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: new Date(date),
          month: date.getMonth(),
          year: date.getFullYear(),
        });
      }
      return additionalDates.slice(0, 7);
    }

    return dates;
  };

  const dates = generateMonthDates();
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString(
    "en-US",
    { month: "long" }
  );

  // Filter events for the selected date
  const getEventsForSelectedDate = () => {
    if (!events.length) return [];

    const selectedFullDate = dates.find(
      (d: DateItem) => d.date === selectedDate
    )?.fullDate;
    if (!selectedFullDate) return events; // Show all events if no specific date selected

    return events.filter((event) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === selectedFullDate.getDate() &&
        eventDate.getMonth() === selectedFullDate.getMonth() &&
        eventDate.getFullYear() === selectedFullDate.getFullYear()
      );
    });
  };

  const filteredEvents = getEventsForSelectedDate();

  // Delete event function
  const handleDeleteEvent = async () => {
    if (!eventToDelete || deleting) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/events/${eventToDelete._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      // Remove the event from local state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event._id !== eventToDelete._id)
      );

      setDeleteDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Check if user can delete an event (owner)
  const canDeleteEvent = (event: any) => {
    if (!isAuthenticated || !user) return false;

    // User can delete their own events
    if (event.createdBy && event.createdBy._id === user._id) return true;

    // For now, allow deletion if user created the event or if no creator info
    if (!event.createdBy) return true;

    return false;
  };

  // Fetch events from backend API
  const fetchEvents = async () => {
    try {
      const res = await fetch(apiUrl("/api/events"));
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-kaizen-black text-kaizen-white max-w-sm mx-auto relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button
          variant="ghost"
          size="icon"
          className="text-kaizen-white hover:bg-kaizen-dark-gray rounded-full"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-kaizen-white font-semibold text-lg">
          Upcoming Event
        </h1>
        <Button
          variant="ghost"
          size="icon"
          className="text-kaizen-white hover:bg-kaizen-dark-gray rounded-full"
        >
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-kaizen-white hover:bg-kaizen-dark-gray rounded-full"
            onClick={() => {
              if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
              } else {
                setCurrentMonth(currentMonth - 1);
              }
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-kaizen-white font-semibold text-2xl">
            {monthName} {currentYear}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-kaizen-white hover:bg-kaizen-dark-gray rounded-full"
            onClick={() => {
              if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
              } else {
                setCurrentMonth(currentMonth + 1);
              }
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Today Button */}
        {(currentMonth !== today.getMonth() ||
          currentYear !== today.getFullYear()) && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="text-kaizen-yellow text-sm hover:bg-kaizen-yellow/10"
              onClick={() => {
                setCurrentMonth(today.getMonth());
                setCurrentYear(today.getFullYear());
                setSelectedDate(today.getDate());
              }}
            >
              Go to Today
            </Button>
          </div>
        )}
      </div>

      {/* Date Selector */}
      <div className="px-4 mb-6 hide-scrollbar" style={{ overflow: "hidden" }}>
        <div
          className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {dates.map((item: DateItem) => (
            <button
              key={`${item.date}-${item.month}-${item.year}`}
              onClick={() => setSelectedDate(item.date)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-16 rounded-2xl transition-colors ${
                selectedDate === item.date
                  ? "bg-kaizen-yellow text-kaizen-black"
                  : "bg-kaizen-dark-gray text-kaizen-white hover:bg-kaizen-gray/50"
              }`}
            >
              <span className="text-2xl font-bold">{item.date}</span>
              <span className="text-xs font-medium">{item.day}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="px-4 pb-20">
        {loading ? (
          <div className="text-center py-8 text-kaizen-gray">
            Loading events...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-kaizen-gray">
            {selectedDate
              ? `No events found for ${monthName} ${selectedDate}.`
              : "No events found."}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-kaizen-white font-medium text-sm">
              {filteredEvents.length} event
              {filteredEvents.length !== 1 ? "s" : ""} for {monthName}{" "}
              {selectedDate}
            </h3>
            {filteredEvents.map((event, index) => (
              <Card
                key={event._id || index}
                className="bg-kaizen-dark-gray border-none rounded-2xl p-4 hover:bg-kaizen-gray/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Event Image */}
                  <div
                    className="flex-shrink-0 cursor-pointer"
                    onClick={() => router.push(`/event/${event._id}`)}
                  >
                    <img
                      src={
                        event.imageUrl
                          ? imageUrl(event.imageUrl)
                          : "/placeholder.svg"
                      }
                      alt={event.title}
                      className="w-12 h-12 rounded-xl object-cover"
                    />
                  </div>

                  {/* Event Details */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => router.push(`/event/${event._id}`)}
                  >
                    <h3 className="text-kaizen-white font-semibold text-sm truncate">
                      {event.title}
                    </h3>
                    <p className="text-kaizen-gray text-sm truncate">
                      {event.description || "No description available"}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      {event.date && (
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              getEventStatus(event.date).isCompleted
                                ? "bg-kaizen-gray"
                                : "bg-kaizen-yellow"
                            }`}
                          ></div>
                          <span className="text-kaizen-gray text-xs">
                            {new Date(event.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {new Date(event.date).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-kaizen-gray"></div>
                        <span className="text-kaizen-gray text-xs">
                          {event.location || "Location TBD"}
                        </span>
                      </div>
                    </div>
                    {event.category && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-block bg-kaizen-yellow/20 text-kaizen-yellow px-2 py-1 rounded-full text-xs">
                          {event.category}
                        </span>
                        {getEventStatus(event.date).isCompleted && (
                          <span className="inline-block bg-kaizen-gray text-kaizen-white px-2 py-1 rounded-full text-xs">
                            Event Completed
                          </span>
                        )}
                      </div>
                    )}
                    {!event.category &&
                      getEventStatus(event.date).isCompleted && (
                        <div className="mt-2">
                          <span className="inline-block bg-kaizen-gray text-kaizen-white px-2 py-1 rounded-full text-xs">
                            Event Completed
                          </span>
                        </div>
                      )}
                  </div>

                  {/* Price and Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-kaizen-white font-semibold text-sm">
                        {event.price ? `${event.price} FLOW` : "Free"}
                      </p>
                      {event.seats && (
                        <p className="text-kaizen-gray text-xs">
                          {event.seats} seats
                        </p>
                      )}
                    </div>

                    {/* Action Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-kaizen-white hover:bg-kaizen-gray/20 w-8 h-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-kaizen-dark-gray border-kaizen-gray/30"
                      >
                        <DropdownMenuItem
                          onClick={() => router.push(`/event/${event._id}`)}
                          className="text-kaizen-white hover:bg-kaizen-gray/20 cursor-pointer"
                        >
                          <Info className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canDeleteEvent(event) && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventToDelete(event);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-400 hover:bg-red-400/10 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Event
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4">
        <Button
          onClick={() => router.push("/event/create")}
          className="w-14 h-14 bg-kaizen-yellow text-kaizen-black hover:bg-kaizen-yellow/90 rounded-full shadow-lg flex items-center justify-center"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-kaizen-dark-gray border-kaizen-gray/30 text-kaizen-white max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-kaizen-white">
              Delete Event
            </AlertDialogTitle>
            <AlertDialogDescription className="text-kaizen-gray">
              Are you sure you want to delete "{eventToDelete?.title}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-kaizen-gray/20 text-kaizen-white border-kaizen-gray/30 hover:bg-kaizen-gray/30"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
