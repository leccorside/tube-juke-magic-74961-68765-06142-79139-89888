-- Add DELETE policy for songs table
CREATE POLICY "Anyone can delete songs" 
ON public.songs 
FOR DELETE 
USING (true);