// Utility functions for event management API calls

export const deleteEvent = async (
  eventId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete event");
    }

    const result = await response.json();
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete event",
    };
  }
};

export const fetchEvent = async (
  eventId: string
): Promise<{ event: any; error?: string }> => {
  try {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch event");
    }

    const event = await response.json();
    return { event };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      event: null,
      error: error instanceof Error ? error.message : "Failed to fetch event",
    };
  }
};

export const fetchEvents = async (): Promise<{
  events: any[];
  error?: string;
}> => {
  try {
    const response = await fetch("/api/events", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const events = await response.json();
    return { events };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      events: [],
      error: error instanceof Error ? error.message : "Failed to fetch events",
    };
  }
};
