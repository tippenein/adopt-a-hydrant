class ThingsController < ApplicationController
  respond_to :json

  def show
    if params[:adopted] == "true"
      @things = Thing.where("user_id is not null").limit(params[:limit] || 100)
    else
      @things = Thing.find_closest(params[:lat], params[:lng], params[:limit] || 10)
    end
    
    unless @things.blank?
      respond_with @things
    else
      render(json: {errors: {address: [t("errors.not_found", thing: t("defaults.thing"))]}}, status: 404)
    end
  end

  def update
    @thing = Thing.find(params[:id])
    if @thing.update_attributes(params[:thing])
      respond_with @thing
    else
      render(json: {errors: @thing.errors}, status: 500)
    end
  end
end
